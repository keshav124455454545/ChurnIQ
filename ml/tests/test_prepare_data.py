"""
Unit Tests for Data Preparation Module.
"""

import sys
import unittest
from pathlib import Path
import pandas as pd

# Add ml/src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from prepare_data import clean_telco_data


class TestDataPreparation(unittest.TestCase):
    """Test suite verifying data cleaning transformations."""

    def setUp(self):
        self.raw_path = Path("ml/data/raw/Telco-Customer-Churn.csv")
        self.test_processed_path = Path("ml/data/processed/test_telco_cleaned.csv")

    def tearDown(self):
        if self.test_processed_path.exists():
            self.test_processed_path.unlink()

    def test_clean_telco_data_zero_imputation(self):
        """Verify clean_telco_data with default zero imputation."""
        df_clean, metrics = clean_telco_data(
            raw_path=self.raw_path,
            processed_path=self.test_processed_path,
            imputation_strategy="zero",
        )
        self.assertEqual(len(df_clean), 7043)
        self.assertEqual(metrics["dropped_rows"], 0)
        self.assertEqual(metrics["transformed_records"], 11)
        self.assertEqual(df_clean["TotalCharges"].dtype, "float64")
        self.assertFalse(df_clean["TotalCharges"].isna().any())
        self.assertTrue(self.test_processed_path.exists())

        # Check that tenure=0 rows have TotalCharges == 0.0
        zero_tenure_tc = df_clean.loc[df_clean["tenure"] == 0, "TotalCharges"]
        self.assertTrue((zero_tenure_tc == 0.0).all())

    def test_clean_telco_data_drop_strategy(self):
        """Verify clean_telco_data with drop imputation strategy."""
        df_clean, metrics = clean_telco_data(
            raw_path=self.raw_path,
            processed_path=self.test_processed_path,
            imputation_strategy="drop",
        )
        self.assertEqual(len(df_clean), 7032)
        self.assertEqual(metrics["dropped_rows"], 11)
        self.assertEqual(metrics["transformed_records"], 0)
        self.assertFalse((df_clean["tenure"] == 0).any())


if __name__ == "__main__":
    unittest.main()
