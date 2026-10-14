"""
Unit Tests for Data Validation Module.
Uses Python's standard library unittest framework.
"""

import sys
import unittest
from pathlib import Path
import pandas as pd
import numpy as np

# Ensure ml/src is in Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from data_validation import (
    DataValidator,
    EXPECTED_COLUMNS,
    TARGET_COLUMN,
    VALID_TARGET_VALUES,
)


class TestDataValidator(unittest.TestCase):
    """Test suite verifying DataValidator behavior against synthetic and real data."""

    def setUp(self):
        """Create a minimal valid synthetic Telco DataFrame for testing edge cases."""
        self.raw_csv_path = Path("ml/data/raw/Telco-Customer-Churn.csv")
        self.sample_valid_data = {
            "customerID": ["7590-VHVEG", "5575-GNVDE"],
            "gender": ["Female", "Male"],
            "SeniorCitizen": ["0", "0"],
            "Partner": ["Yes", "No"],
            "Dependents": ["No", "No"],
            "tenure": ["1", "34"],
            "PhoneService": ["No", "Yes"],
            "MultipleLines": ["No phone service", "No"],
            "InternetService": ["DSL", "DSL"],
            "OnlineSecurity": ["No", "Yes"],
            "OnlineBackup": ["Yes", "No"],
            "DeviceProtection": ["No", "Yes"],
            "TechSupport": ["No", "No"],
            "StreamingTV": ["No", "No"],
            "StreamingMovies": ["No", "No"],
            "Contract": ["Month-to-month", "One year"],
            "PaperlessBilling": ["Yes", "No"],
            "PaymentMethod": ["Electronic check", "Mailed check"],
            "MonthlyCharges": ["29.85", "56.95"],
            "TotalCharges": ["29.85", "1889.5"],
            "Churn": ["No", "No"],
        }
        self.valid_df = pd.DataFrame(self.sample_valid_data)

    def test_real_dataset_exists_and_passes(self):
        """Verify the actual raw Telco dataset file exists and passes validation."""
        self.assertTrue(self.raw_csv_path.exists(), "Raw dataset file must exist.")
        validator = DataValidator(self.raw_csv_path)
        report = validator.validate()
        self.assertTrue(report.is_valid, f"Validation failed with errors: {report.errors}")
        self.assertEqual(report.metrics["row_count"], 7043)
        self.assertEqual(report.metrics["column_count"], 21)
        self.assertEqual(report.metrics["target_distribution"], {"No": 5174, "Yes": 1869})

    def test_missing_file_reports_error(self):
        """Verify non-existent file produces validation error."""
        non_existent = Path("ml/data/raw/does_not_exist.csv")
        validator = DataValidator(non_existent)
        report = validator.validate()
        self.assertFalse(report.is_valid)
        self.assertTrue(any("does not exist" in e for e in report.errors))

    def test_missing_target_column(self):
        """Verify missing Churn column causes validation failure."""
        df_no_target = self.valid_df.drop(columns=[TARGET_COLUMN])
        validator = DataValidator(self.raw_csv_path)
        report = validator.validate(df=df_no_target)
        self.assertFalse(report.is_valid)
        self.assertTrue(any("Required target column 'Churn' is missing" in e for e in report.errors))

    def test_invalid_target_values(self):
        """Verify non-standard target labels (e.g. 'Maybe') trigger error."""
        bad_df = self.valid_df.copy()
        bad_df.loc[0, "Churn"] = "Maybe"
        validator = DataValidator(self.raw_csv_path)
        report = validator.validate(df=bad_df)
        self.assertFalse(report.is_valid)
        self.assertTrue(any("invalid labels" in e for e in report.errors))

    def test_blank_total_charges_warning(self):
        """Verify blank TotalCharges raises warning and records count."""
        df_blank_tc = self.valid_df.copy()
        df_blank_tc.loc[0, "TotalCharges"] = " "
        validator = DataValidator(self.raw_csv_path)
        report = validator.validate(df=df_blank_tc)
        self.assertTrue(report.is_valid)  # Raw data is valid but flagged with warning
        self.assertTrue(any("TotalCharges" in w and "blank" in w for w in report.warnings))
        self.assertEqual(report.metrics["columns_with_blank_strings"]["TotalCharges"], 1)

    def test_duplicate_customer_ids(self):
        """Verify duplicate customer IDs trigger validation error."""
        df_dup = self.valid_df.copy()
        df_dup.loc[1, "customerID"] = df_dup.loc[0, "customerID"]
        validator = DataValidator(self.raw_csv_path)
        report = validator.validate(df=df_dup)
        self.assertFalse(report.is_valid)
        self.assertTrue(any("duplicate values" in e for e in report.errors))

    def test_invalid_categorical_domain(self):
        """Verify unexpected category value triggers error."""
        bad_df = self.valid_df.copy()
        bad_df.loc[0, "Contract"] = "Five year"
        validator = DataValidator(self.raw_csv_path)
        report = validator.validate(df=bad_df)
        self.assertFalse(report.is_valid)
        self.assertTrue(any("Contract" in e and "unexpected category values" in e for e in report.errors))

    def test_negative_monthly_charges(self):
        """Verify negative numerical values trigger error."""
        bad_df = self.valid_df.copy()
        bad_df.loc[0, "MonthlyCharges"] = "-10.0"
        validator = DataValidator(self.raw_csv_path)
        report = validator.validate(df=bad_df)
        self.assertFalse(report.is_valid)
        self.assertTrue(any("MonthlyCharges" in e and "<= 0" in e for e in report.errors))


if __name__ == "__main__":
    unittest.main()
