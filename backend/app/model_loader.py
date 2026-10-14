"""
Model Loader and Inference Service for ChurnIQ Backend.
Safely manages artifact loading, caching, and deterministic prediction execution.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import json
import logging
import joblib
import pandas as pd
import numpy as np

from app.config import settings
from app.schemas import (
    CustomerInput,
    PredictionResponse,
    BatchPredictionItem,
    BatchPredictionResponse,
    BatchPredictionSummary,
)

logger = logging.getLogger("ChurnIQ.ModelLoader")


class ModelService:
    """Singleton service wrapping the fitted ML pipeline and metadata."""

    def __init__(self, artifacts_dir: Optional[Path] = None):
        self.artifacts_dir = artifacts_dir or settings.ARTIFACTS_DIR
        self.pipeline = None
        self.schema = None
        self.metadata = None
        self.evaluation_metrics = None
        self.is_ready = False
        self.error_message: Optional[str] = None

        self.load_artifacts()

    def load_artifacts(self) -> bool:
        """Loads model pipeline and all associated JSON metadata files."""
        try:
            model_path = self.artifacts_dir / "churn_model.joblib"
            schema_path = self.artifacts_dir / "feature_schema.json"
            meta_path = self.artifacts_dir / "model_metadata.json"
            eval_path = self.artifacts_dir / "evaluation_metrics.json"

            if not model_path.exists():
                raise FileNotFoundError(f"Missing pipeline artifact: {model_path.name}")
            if not schema_path.exists():
                raise FileNotFoundError(f"Missing schema artifact: {schema_path.name}")
            if not meta_path.exists():
                raise FileNotFoundError(f"Missing metadata artifact: {meta_path.name}")
            if not eval_path.exists():
                raise FileNotFoundError(f"Missing metrics artifact: {eval_path.name}")

            logger.info("Loading model pipeline from %s", model_path)
            self.pipeline = joblib.load(model_path)

            with open(schema_path, "r", encoding="utf-8") as f:
                self.schema = json.load(f)

            with open(meta_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

            with open(eval_path, "r", encoding="utf-8") as f:
                self.evaluation_metrics = json.load(f)

            self.is_ready = True
            self.error_message = None
            logger.info("Model artifacts loaded successfully. Champion: %s", self.metadata.get("model_name"))
            return True

        except Exception as exc:
            self.is_ready = False
            self.error_message = str(exc)
            logger.error("Failed to load model artifacts: %s", exc)
            return False

    def predict_single(self, customer: CustomerInput) -> PredictionResponse:
        """Runs single-customer inference using the verified pipeline."""
        if not self.is_ready or self.pipeline is None:
            raise RuntimeError("Model is not loaded or ready for inference.")

        data_dict = customer.to_inference_dict()
        feature_order = self.schema["all_feature_names"]
        df = pd.DataFrame([data_dict])[feature_order]

        # Convert numeric columns to numeric float
        for num_f in self.schema["numerical_features"]:
            df[num_f] = pd.to_numeric(df[num_f], errors="coerce")

        # Positive churn class probability (index 1)
        proba = float(self.pipeline.predict_proba(df)[0, 1])
        threshold = float(self.metadata.get("decision_threshold", 0.50))
        prediction = "Yes" if proba >= threshold else "No"

        if proba < 0.35:
            risk = "Low"
            explanation = "Low churn risk. Customer profile indicates stable retention."
        elif proba < 0.65:
            risk = "Medium"
            explanation = "Moderate risk. Account could benefit from loyalty incentives or annual plan discounts."
        else:
            risk = "High"
            explanation = "High risk of churn. Consider reaching out with contract upgrades or targeted retention offers."

        return PredictionResponse(
            prediction=prediction,
            churn_probability=round(proba, 4),
            risk_category=risk,
            model_version=self.metadata.get("version", "1.0.0"),
            model_algorithm=self.metadata.get("champion_algorithm", "RandomForest"),
            threshold_used=threshold,
            explanation=explanation,
        )

    def predict_batch(self, raw_rows: List[Dict[str, Any]]) -> BatchPredictionResponse:
        """Runs batch inference safely across arbitrary JSON / CSV dictionaries."""
        if not self.is_ready or self.pipeline is None:
            raise RuntimeError("Model is not loaded or ready for inference.")

        if len(raw_rows) > settings.MAX_BATCH_SIZE:
            raise ValueError(f"Batch size {len(raw_rows)} exceeds maximum allowed of {settings.MAX_BATCH_SIZE}.")

        results: List[BatchPredictionItem] = []
        valid_items: List[Tuple[int, Dict[str, Any]]] = []
        feature_order = self.schema["all_feature_names"]

        for idx, row in enumerate(raw_rows):
            cid = row.get("customerID") or row.get("customerId") or None
            try:
                # Validate through Pydantic
                validated_input = CustomerInput(**row)
                valid_items.append((idx, validated_input.to_inference_dict(), cid, row))
            except Exception as err:
                results.append(
                    BatchPredictionItem(
                        row_index=idx,
                        is_valid=False,
                        errors=[str(err)],
                        customer_id=cid,
                        input_data=row,
                    )
                )

        # Batch inference for valid items
        if valid_items:
            indices = [item[0] for item in valid_items]
            dfs_rows = [item[1] for item in valid_items]
            cids = [item[2] for item in valid_items]
            original_rows = [item[3] for item in valid_items]
            df = pd.DataFrame(dfs_rows)[feature_order]

            for num_f in self.schema["numerical_features"]:
                df[num_f] = pd.to_numeric(df[num_f], errors="coerce")

            probas = self.pipeline.predict_proba(df)[:, 1]
            threshold = float(self.metadata.get("decision_threshold", 0.50))

            for orig_idx, p, cid, orig_row in zip(indices, probas, cids, original_rows):
                proba = float(p)
                pred = "Yes" if proba >= threshold else "No"
                if proba < 0.35:
                    risk = "Low"
                elif proba < 0.65:
                    risk = "Medium"
                else:
                    risk = "High"

                results.append(
                    BatchPredictionItem(
                        row_index=orig_idx,
                        is_valid=True,
                        customer_id=cid,
                        prediction=pred,
                        churn_probability=round(proba, 4),
                        risk_category=risk,
                        input_data=orig_row,
                    )
                )

        # Restore input ordering
        results.sort(key=lambda r: r.row_index)

        # Compute summary
        valid_count = len([r for r in results if r.is_valid])
        invalid_count = len([r for r in results if not r.is_valid])
        churn_count = len([r for r in results if r.prediction == "Yes"])
        retained_count = len([r for r in results if r.prediction == "No"])
        high_risk = len([r for r in results if r.risk_category == "High"])
        med_risk = len([r for r in results if r.risk_category == "Medium"])
        low_risk = len([r for r in results if r.risk_category == "Low"])

        churn_pct = round((churn_count / valid_count * 100), 2) if valid_count > 0 else 0.0

        summary = BatchPredictionSummary(
            total_records=len(raw_rows),
            valid_records=valid_count,
            invalid_records=invalid_count,
            predicted_churn_count=churn_count,
            predicted_retained_count=retained_count,
            churn_rate_percent=churn_pct,
            high_risk_count=high_risk,
            medium_risk_count=med_risk,
            low_risk_count=low_risk,
        )

        return BatchPredictionResponse(
            summary=summary,
            results=results,
            model_version=self.metadata.get("version", "1.0.0"),
        )


# Global service instance
model_service = ModelService()
