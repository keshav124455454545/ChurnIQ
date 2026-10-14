"""
Unit Tests for Machine Learning Pipeline & Inference.
"""

import sys
import unittest
from pathlib import Path
import json
import joblib
import pandas as pd
import numpy as np

# Add ml/src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from predict import ChurnPredictor


class TestModelPipeline(unittest.TestCase):
    """Test suite verifying saved pipeline artifacts and inference validity."""

    @classmethod
    def setUpClass(cls):
        cls.predictor = ChurnPredictor()
        cls.sample_valid_customer = {
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

    def test_artifacts_exist(self):
        """Verify model, metadata, schema, and evaluation metrics exist on disk."""
        artifacts_dir = Path("ml/artifacts")
        self.assertTrue((artifacts_dir / "churn_model.joblib").exists())
        self.assertTrue((artifacts_dir / "model_metadata.json").exists())
        self.assertTrue((artifacts_dir / "feature_schema.json").exists())
        self.assertTrue((artifacts_dir / "evaluation_metrics.json").exists())

    def test_single_prediction_structure_and_bounds(self):
        """Verify single prediction output schema and probability range [0, 1]."""
        res = self.predictor.predict_one(self.sample_valid_customer)
        self.assertIn("prediction", res)
        self.assertIn("churn_probability", res)
        self.assertIn("risk_category", res)
        self.assertIn(res["prediction"], ["Yes", "No"])
        self.assertIn(res["risk_category"], ["Low", "Medium", "High"])
        self.assertGreaterEqual(res["churn_probability"], 0.0)
        self.assertLessEqual(res["churn_probability"], 1.0)

    def test_batch_prediction_ordering_and_length(self):
        """Verify batch prediction returns same count in exact order."""
        loyal_customer = self.sample_valid_customer.copy()
        loyal_customer["Contract"] = "Two year"
        loyal_customer["tenure"] = 65
        loyal_customer["PaymentMethod"] = "Credit card (automatic)"

        batch = [self.sample_valid_customer, loyal_customer]
        res = self.predictor.predict_batch(batch)
        self.assertEqual(len(res), 2)
        self.assertEqual(res[0]["row_index"], 0)
        self.assertEqual(res[1]["row_index"], 1)
        self.assertTrue(res[0]["is_valid"])
        self.assertTrue(res[1]["is_valid"])

        # Loyal customer should have lower churn probability than high-risk customer
        self.assertLess(res[1]["churn_probability"], res[0]["churn_probability"])

    def test_missing_feature_rejected(self):
        """Verify missing feature raises ValueError."""
        incomplete = self.sample_valid_customer.copy()
        del incomplete["Contract"]
        with self.assertRaises(ValueError) as ctx:
            self.predictor.predict_one(incomplete)
        self.assertIn("Contract", str(ctx.exception))

    def test_negative_numeric_rejected(self):
        """Verify negative tenure is rejected."""
        invalid_num = self.sample_valid_customer.copy()
        invalid_num["tenure"] = -5
        with self.assertRaises(ValueError) as ctx:
            self.predictor.predict_one(invalid_num)
        self.assertIn("negative", str(ctx.exception))

    def test_model_determinism_and_reloading(self):
        """Verify reloading the model gives bit-identical probability."""
        reloaded = ChurnPredictor()
        res1 = self.predictor.predict_one(self.sample_valid_customer)
        res2 = reloaded.predict_one(self.sample_valid_customer)
        self.assertEqual(res1["churn_probability"], res2["churn_probability"])
        self.assertEqual(res1["prediction"], res2["prediction"])


if __name__ == "__main__":
    unittest.main()
