"""
Data Preparation & Cleaning Script for ChurnIQ ML Pipeline.

This script executes preliminary data cleaning on the raw Telco dataset:
1. Validates the raw dataset integrity using data_validation.
2. Cleans whitespace from column names and string values.
3. Converts TotalCharges to numeric, imputing 0.0 for tenure=0 customers (user approved).
4. Tracks row counts before and after all operations.
5. Emits detailed logs of all records touched or transformed.
6. Validates the resulting clean dataset before saving to ml/data/processed/telco_churn_cleaned.csv.
7. NEVER overwrites the raw dataset, NEVER fits encoders/scalers, and NEVER leaks target labels.
"""

from pathlib import Path
from typing import Dict, Any, Tuple
import logging
import pandas as pd
import numpy as np

# Import validation module
from data_validation import DataValidator, ValidationReport

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ChurnIQ.DataPrep")


def clean_telco_data(
    raw_path: Path | str = Path("ml/data/raw/Telco-Customer-Churn.csv"),
    processed_path: Path | str = Path("ml/data/processed/telco_churn_cleaned.csv"),
    imputation_strategy: str = "zero",  # 'zero' or 'drop'
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Loads, validates, cleans, and saves the Telco churn dataset.

    Args:
        raw_path: Path to the untouched raw CSV file.
        processed_path: Destination path for the cleaned CSV file.
        imputation_strategy: 'zero' (default, non-destructive imputation for tenure=0)
                             or 'drop' (removes the 11 records).

    Returns:
        Tuple of (cleaned DataFrame, metadata dictionary of audit metrics).
    """
    raw_path = Path(raw_path)
    processed_path = Path(processed_path)

    logger.info("Step 1: Validating raw input dataset at %s", raw_path)
    validator = DataValidator(raw_path)
    initial_report = validator.validate()

    if not initial_report.is_valid:
        error_msg = f"Raw dataset failed validation checks: {initial_report.errors}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    logger.info("Raw dataset validation passed with %d warnings.", len(initial_report.warnings))

    # Read raw dataset into memory (never modified on disk)
    df = pd.read_csv(raw_path)
    initial_row_count = len(df)
    initial_col_count = len(df.columns)
    logger.info("Loaded %d rows and %d columns from raw dataset.", initial_row_count, initial_col_count)

    audit_metrics: Dict[str, Any] = {
        "raw_path": str(raw_path),
        "processed_path": str(processed_path),
        "initial_rows": initial_row_count,
        "initial_columns": initial_col_count,
        "imputation_strategy": imputation_strategy,
        "dropped_rows": 0,
        "transformed_records": 0,
    }

    # Step 2: Clean whitespace in column headers
    cleaned_columns = [col.strip() for col in df.columns]
    if cleaned_columns != list(df.columns):
        logger.info("Stripped whitespace from column headers.")
    df.columns = cleaned_columns

    # Step 3: Clean whitespace across all string/object columns
    text_cols = df.select_dtypes(include=["object", "str"]).columns
    for col in text_cols:
        df[col] = df[col].astype(str).str.strip()

    # Step 4: Inspect blank TotalCharges entries
    tc_blank_mask = df["TotalCharges"] == ""
    tc_blank_count = int(tc_blank_mask.sum())
    logger.info("Identified %d records with blank TotalCharges strings.", tc_blank_count)

    if tc_blank_count > 0:
        tenure_of_blanks = df.loc[tc_blank_mask, "tenure"].unique()
        logger.info(
            "Tenure values for customers with blank TotalCharges: %s",
            tenure_of_blanks.tolist(),
        )

        if imputation_strategy == "zero":
            # Domain rationale: tenure == 0 means customer joined in current cycle and has accumulated 0 charges.
            logger.info("Applying non-destructive imputation: TotalCharges = 0.0 for %d tenure=0 records.", tc_blank_count)
            df.loc[tc_blank_mask, "TotalCharges"] = "0.0"
            audit_metrics["transformed_records"] = tc_blank_count
            audit_metrics["dropped_rows"] = 0
        elif imputation_strategy == "drop":
            logger.warning("Applying destructive removal: Dropping %d records with blank TotalCharges.", tc_blank_count)
            df = df.loc[~tc_blank_mask].copy()
            audit_metrics["dropped_rows"] = tc_blank_count
            audit_metrics["transformed_records"] = 0
        else:
            raise ValueError(f"Unknown imputation strategy: {imputation_strategy}. Choose 'zero' or 'drop'.")

    # Step 5: Convert TotalCharges to numeric float64
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="raise")
    logger.info("TotalCharges successfully converted to numeric (float64).")

    # Step 6: Verify SeniorCitizen is int64
    df["SeniorCitizen"] = df["SeniorCitizen"].astype(int)

    # Step 7: Record final metrics
    final_row_count = len(df)
    audit_metrics["final_rows"] = final_row_count
    audit_metrics["final_columns"] = len(df.columns)
    audit_metrics["churn_distribution"] = df["Churn"].value_counts().to_dict()
    audit_metrics["churn_percentage"] = round((df["Churn"] == "Yes").mean() * 100, 2)

    logger.info(
        "Row count audit: Initial=%d, Final=%d, Difference=%d",
        initial_row_count,
        final_row_count,
        initial_row_count - final_row_count,
    )

    # Step 8: Save cleaned copy to processed directory
    processed_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(processed_path, index=False)
    logger.info("Successfully saved clean dataset to %s", processed_path)

    # Step 9: Post-cleaning validation
    processed_validator = DataValidator(processed_path)
    post_report = processed_validator.validate()
    if not post_report.is_valid:
        error_msg = f"Processed dataset failed validation: {post_report.errors}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    # Check that processed dataset has 0 warnings regarding blank TotalCharges
    remaining_blank_tc = post_report.metrics.get("columns_with_blank_strings", {}).get("TotalCharges", 0)
    if remaining_blank_tc > 0:
        raise ValueError(f"Processed dataset still contains {remaining_blank_tc} blank TotalCharges!")

    logger.info("Post-cleaning validation PASSED with 0 errors. Dataset is ready for feature engineering.")
    return df, audit_metrics


if __name__ == "__main__":
    logger.info("Executing preliminary data cleaning pipeline...")
    cleaned_df, metrics = clean_telco_data()
    print("\n" + "=" * 60)
    print("DATA PREPARATION SUMMARY")
    print("=" * 60)
    for k, v in metrics.items():
        print(f"  {k}: {v}")
    print("=" * 60)
