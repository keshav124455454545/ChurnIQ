"""
Inference & Prediction Module for ChurnIQ.

Loads the saved scikit-learn Pipeline artifact, validates single or batch
inputs against feature schema, and outputs deterministic churn predictions,
positive-class probabilities, and risk categories.
"""

from pathlib import Path
from typing import Any, Dict, List, Tuple, Union
import json
import logging
import joblib
import pandas as pd
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ChurnIQ.Predict")

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "churn_model.joblib"
SCHEMA_PATH = ARTIFACTS_DIR / "feature_schema.json"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"


class ChurnPredictor:
    """Production inference engine for ChurnIQ."""

    def __init__(
        self,
        model_path: Union[str, Path] = MODEL_PATH,
        schema_path: Union[str, Path] = SCHEMA_PATH,
    ):
        self.model_path = Path(model_path)
        self.schema_path = Path(schema_path)

        if not self.model_path.exists():
            raise FileNotFoundError(f"Model artifact not found at: {self.model_path.resolve()}")
        if not self.schema_path.exists():
            raise FileNotFoundError(f"Schema artifact not found at: {self.schema_path.resolve()}")

        # Load artifacts
        logger.info("Loading model from %s", self.model_path)
        self.pipeline = joblib.load(self.model_path)

        with open(self.schema_path, "r", encoding="utf-8") as f:
            self.schema = json.load(f)

        self.expected_features: List[str] = self.schema["all_feature_names"]
        self.numerical_features: Dict[str, Any] = self.schema["numerical_features"]
        self.categorical_features: Dict[str, Any] = self.schema["categorical_features"]
        self.positive_class_index = 1

    def validate_record(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validates that a single input dictionary satisfies schema constraints."""
        errors: List[str] = []
        for feat in self.expected_features:
            if feat not in record:
                errors.append(f"Missing required field: '{feat}'")
            elif record[feat] is None or record[feat] == "":
                errors.append(f"Field '{feat}' cannot be null or empty.")

        # Check numeric types
        for num_f, meta in self.numerical_features.items():
            if num_f in record and record[num_f] is not None and record[num_f] != "":
                try:
                    val = float(record[num_f])
                    if np.isnan(val) or np.isinf(val):
                        errors.append(f"Field '{num_f}' must be a finite number.")
                    elif val < 0:
                        errors.append(f"Field '{num_f}' cannot be negative (got {val}).")
                except (ValueError, TypeError):
                    errors.append(f"Field '{num_f}' must be a numeric value, got '{record[num_f]}'.")

        return len(errors) == 0, errors

    def predict_one(self, customer_data: Dict[str, Any], threshold: float = 0.50) -> Dict[str, Any]:
        """Runs inference for a single customer record."""
        is_valid, errors = self.validate_record(customer_data)
        if not is_valid:
            raise ValueError(f"Input validation failed: {'; '.join(errors)}")

        df = pd.DataFrame([customer_data])[self.expected_features].copy()
        # Ensure numerical types are numeric
        for col in self.numerical_features:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        # Ensure SeniorCitizen is string
        if "SeniorCitizen" in df.columns:
            df["SeniorCitizen"] = df["SeniorCitizen"].astype(str)

        proba = float(self.pipeline.predict_proba(df)[0, self.positive_class_index])
        prediction = "Yes" if proba >= threshold else "No"

        # Determine risk category
        if proba < 0.35:
            risk_category = "Low"
        elif proba < 0.65:
            risk_category = "Medium"
        else:
            risk_category = "High"

        return {
            "prediction": prediction,
            "churn_probability": round(proba, 4),
            "risk_category": risk_category,
            "threshold_used": threshold,
        }

    def predict_batch(
        self, records: List[Dict[str, Any]], threshold: float = 0.50
    ) -> List[Dict[str, Any]]:
        """Runs batch inference preserving ordering and error diagnostics."""
        results: List[Dict[str, Any]] = []
        valid_records: List[Tuple[int, Dict[str, Any]]] = []

        for idx, rec in enumerate(records):
            is_valid, errs = self.validate_record(rec)
            if not is_valid:
                results.append({
                    "row_index": idx,
                    "is_valid": False,
                    "errors": errs,
                    "prediction": None,
                    "churn_probability": None,
                    "risk_category": None,
                })
            else:
                valid_records.append((idx, rec))

        if valid_records:
            indices = [idx for idx, _ in valid_records]
            raw_dfs = [rec for _, rec in valid_records]
            df = pd.DataFrame(raw_dfs)[self.expected_features].copy()

            for col in self.numerical_features:
                df[col] = pd.to_numeric(df[col], errors="coerce")
            if "SeniorCitizen" in df.columns:
                df["SeniorCitizen"] = df["SeniorCitizen"].astype(str)

            probas = self.pipeline.predict_proba(df)[:, self.positive_class_index]

            for orig_idx, p in zip(indices, probas):
                proba = float(p)
                pred = "Yes" if proba >= threshold else "No"
                if proba < 0.35:
                    risk = "Low"
                elif proba < 0.65:
                    risk = "Medium"
                else:
                    risk = "High"

                results.append({
                    "row_index": orig_idx,
                    "is_valid": True,
                    "errors": [],
                    "prediction": pred,
                    "churn_probability": round(proba, 4),
                    "risk_category": risk,
                })

        # Sort back to original input row order
        results.sort(key=lambda r: r["row_index"])
        return results


if __name__ == "__main__":
    predictor = ChurnPredictor()
    sample_customer = {
        "gender": "Female",
        "SeniorCitizen": "0",
        "Partner": "Yes",
        "Dependents": "No",
        "tenure": 1,
        "PhoneService": "No",
        "MultipleLines": "No phone service",
        "InternetService": "DSL",
        "OnlineSecurity": "No",
        "OnlineBackup": "Yes",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": "No",
        "StreamingMovies": "No",
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
        "MonthlyCharges": 29.85,
        "TotalCharges": 29.85,
    }
    res = predictor.predict_one(sample_customer)
    print("Single Prediction Result:")
    print(json.dumps(res, indent=2))
