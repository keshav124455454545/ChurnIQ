"""
Data Validation Module for ChurnIQ ML Pipeline.

This module provides reusable validation routines for the IBM Telco Customer Churn dataset.
It validates schema conformity, column types, value domains, nulls, whitespace anomalies,
uniqueness constraints, and data integrity without silently modifying or dropping records.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
import re
import pandas as pd
import numpy as np


# Canonical schema definitions according to the IBM Telco Customer Churn specification
EXPECTED_COLUMNS: List[str] = [
    "customerID",
    "gender",
    "SeniorCitizen",
    "Partner",
    "Dependents",
    "tenure",
    "PhoneService",
    "MultipleLines",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
    "Contract",
    "PaperlessBilling",
    "PaymentMethod",
    "MonthlyCharges",
    "TotalCharges",
    "Churn",
]

TARGET_COLUMN: str = "Churn"
VALID_TARGET_VALUES: Set[str] = {"No", "Yes"}
IDENTIFIER_COLUMN: str = "customerID"

EXPECTED_CATEGORICAL_DOMAINS: Dict[str, Set[str]] = {
    "gender": {"Male", "Female"},
    "Partner": {"Yes", "No"},
    "Dependents": {"Yes", "No"},
    "PhoneService": {"Yes", "No"},
    "MultipleLines": {"No phone service", "No", "Yes"},
    "InternetService": {"DSL", "Fiber optic", "No"},
    "OnlineSecurity": {"No", "Yes", "No internet service"},
    "OnlineBackup": {"Yes", "No", "No internet service"},
    "DeviceProtection": {"No", "Yes", "No internet service"},
    "TechSupport": {"No", "Yes", "No internet service"},
    "StreamingTV": {"No", "Yes", "No internet service"},
    "StreamingMovies": {"No", "Yes", "No internet service"},
    "Contract": {"Month-to-month", "One year", "Two year"},
    "PaperlessBilling": {"Yes", "No"},
    "PaymentMethod": {
        "Electronic check",
        "Mailed check",
        "Bank transfer (automatic)",
        "Credit card (automatic)",
    },
    "Churn": {"No", "Yes"},
}

CUSTOMER_ID_REGEX = re.compile(r"^\d{4}-[A-Z]{5}$")


@dataclass
class ValidationReport:
    """Structured report holding data validation results, warnings, and metrics."""
    is_valid: bool = True
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)

    def add_error(self, message: str) -> None:
        self.errors.append(message)
        self.is_valid = False

    def add_warning(self, message: str) -> None:
        self.warnings.append(message)

    def summary(self) -> str:
        lines = [
            "=" * 60,
            "DATA VALIDATION REPORT",
            "=" * 60,
            f"Overall Status: {'PASSED' if self.is_valid else 'FAILED'}",
            f"Errors found:   {len(self.errors)}",
            f"Warnings found: {len(self.warnings)}",
            "-" * 60,
        ]
        if self.metrics:
            lines.append("Key Dataset Metrics:")
            for k, v in self.metrics.items():
                lines.append(f"  - {k}: {v}")
            lines.append("-" * 60)

        if self.errors:
            lines.append("ERRORS (must be resolved):")
            for err in self.errors:
                lines.append(f"  [!] {err}")
            lines.append("-" * 60)

        if self.warnings:
            lines.append("WARNINGS (domain considerations / anomalies):")
            for warn in self.warnings:
                lines.append(f"  [*] {warn}")
            lines.append("-" * 60)

        return "\n".join(lines)


class DataValidator:
    """Reusable validator for Telco Customer Churn datasets."""

    def __init__(self, file_path: str | Path):
        self.file_path = Path(file_path)

    def load_dataset(self) -> Tuple[Optional[pd.DataFrame], ValidationReport]:
        """Validates file presence and readability, returning DataFrame and report."""
        report = ValidationReport()
        if not self.file_path.exists():
            report.add_error(f"File does not exist: {self.file_path.resolve()}")
            return None, report

        if not self.file_path.is_file():
            report.add_error(f"Path is not a regular file: {self.file_path.resolve()}")
            return None, report

        if self.file_path.stat().st_size == 0:
            report.add_error(f"File is empty (0 bytes): {self.file_path.resolve()}")
            return None, report

        try:
            # We read dtype as object initially or let pandas infer, but we need raw strings for checking
            df = pd.read_csv(self.file_path, dtype=str)
        except Exception as exc:
            report.add_error(f"Failed to read CSV file: {exc}")
            return None, report

        return df, report

    def validate(self, df: Optional[pd.DataFrame] = None) -> ValidationReport:
        """Runs the complete suite of schema, data quality, and integrity checks."""
        if df is None:
            df, report = self.load_dataset()
            if df is None:
                return report
        else:
            report = ValidationReport()

        report.metrics["row_count"] = len(df)
        report.metrics["column_count"] = len(df.columns)

        # 1. Target Column Check
        if TARGET_COLUMN not in df.columns:
            report.add_error(
                f"Required target column '{TARGET_COLUMN}' is missing from dataset columns: {list(df.columns)}"
            )
            return report

        # 2. Schema and Column Names Check
        missing_cols = [c for c in EXPECTED_COLUMNS if c not in df.columns]
        extra_cols = [c for c in df.columns if c not in EXPECTED_COLUMNS]

        if missing_cols:
            report.add_error(f"Missing expected schema columns: {missing_cols}")

        if extra_cols:
            report.add_warning(f"Unexpected extra columns present in dataset: {extra_cols}")

        # Column whitespace check
        cols_with_whitespace = [c for c in df.columns if c.strip() != c]
        if cols_with_whitespace:
            report.add_warning(
                f"Column names contain leading/trailing whitespace: {cols_with_whitespace}"
            )

        # 3. Target Label Validation
        raw_target_values = set(df[TARGET_COLUMN].dropna().unique())
        invalid_target_values = raw_target_values - VALID_TARGET_VALUES
        if invalid_target_values:
            report.add_error(
                f"Target column '{TARGET_COLUMN}' contains invalid labels: {invalid_target_values}. "
                f"Expected subset of: {VALID_TARGET_VALUES}"
            )

        target_nulls = df[TARGET_COLUMN].isna().sum()
        if target_nulls > 0:
            report.add_error(f"Target column '{TARGET_COLUMN}' has {target_nulls} missing/null entries.")

        # Class balance metrics
        target_counts = df[TARGET_COLUMN].value_counts().to_dict()
        report.metrics["target_distribution"] = target_counts
        if len(df) > 0 and TARGET_COLUMN in df.columns:
            churn_count = target_counts.get("Yes", 0)
            report.metrics["churn_rate_percent"] = round((churn_count / len(df)) * 100, 2)

        # 4. Customer Identifier Checks
        if IDENTIFIER_COLUMN in df.columns:
            id_series = df[IDENTIFIER_COLUMN]
            null_ids = id_series.isna().sum()
            blank_ids = (id_series.str.strip() == "").sum()
            duplicate_ids = id_series.duplicated().sum()

            if null_ids > 0:
                report.add_error(f"Identifier column '{IDENTIFIER_COLUMN}' contains {null_ids} null values.")
            if blank_ids > 0:
                report.add_error(f"Identifier column '{IDENTIFIER_COLUMN}' contains {blank_ids} blank strings.")
            if duplicate_ids > 0:
                report.add_error(
                    f"Identifier column '{IDENTIFIER_COLUMN}' contains {duplicate_ids} duplicate values. "
                    "Customer IDs must be strictly unique."
                )

            # Format check
            malformed_ids = id_series[~id_series.str.match(CUSTOMER_ID_REGEX, na=False)]
            if len(malformed_ids) > 0:
                report.add_warning(
                    f"{len(malformed_ids)} customerID entries do not match expected regex pattern '####-AAAAA'. "
                    f"Sample: {malformed_ids.head(3).tolist()}"
                )

        # Document non-predictive status of customerID
        report.metrics["identifier_policy"] = (
            "customerID must be excluded from predictive feature matrices to prevent memorization / overfitting."
        )

        # 5. Row Duplication Check
        # Check duplicate rows across all features (excluding ID if present)
        feature_cols = [c for c in df.columns if c != IDENTIFIER_COLUMN]
        full_dups = df.duplicated().sum()
        feature_dups = df.duplicated(subset=feature_cols).sum() if feature_cols else 0
        report.metrics["exact_duplicate_rows"] = int(full_dups)
        report.metrics["feature_duplicate_rows"] = int(feature_dups)

        if full_dups > 0:
            report.add_warning(
                f"Found {full_dups} fully duplicated rows across all columns. Recommended treatment: review before dropping."
            )

        # 6. Missing and Blank Value Checks Across Columns
        missing_by_col = {}
        blanks_by_col = {}
        for col in df.columns:
            n_null = df[col].isna().sum()
            n_blank = (df[col].astype(str).str.strip() == "").sum()
            if n_null > 0:
                missing_by_col[col] = int(n_null)
            if n_blank > 0:
                blanks_by_col[col] = int(n_blank)

        report.metrics["columns_with_nulls"] = missing_by_col
        report.metrics["columns_with_blank_strings"] = blanks_by_col

        if missing_by_col:
            report.add_warning(f"Standard null values detected: {missing_by_col}")

        # 7. TotalCharges Validation
        if "TotalCharges" in df.columns:
            tc_series = df["TotalCharges"]
            tc_blanks = (tc_series.str.strip() == "").sum()
            if tc_blanks > 0:
                # Warning or error depending on whether dataset is raw or preprocessed
                report.add_warning(
                    f"Column 'TotalCharges' contains {tc_blanks} blank/whitespace strings. "
                    "These represent customers with tenure=0 who have not completed a billing cycle. "
                    "Recommended treatment: impute with 0.0 or handle explicitly before model training."
                )

            # Check non-blank convertible to numeric
            non_blank_tc = tc_series[tc_series.str.strip() != ""]
            coerced_tc = pd.to_numeric(non_blank_tc, errors="coerce")
            unparseable_tc = coerced_tc.isna().sum()
            if unparseable_tc > 0:
                report.add_error(
                    f"Column 'TotalCharges' contains {unparseable_tc} non-numeric, non-blank strings that cannot be parsed."
                )

            # Check for negative total charges
            valid_tc = coerced_tc.dropna()
            if (valid_tc < 0).any():
                report.add_error("Column 'TotalCharges' contains negative values, which are invalid.")

        # 8. Numerical Columns Checks (tenure, MonthlyCharges, SeniorCitizen)
        if "tenure" in df.columns:
            tenure_num = pd.to_numeric(df["tenure"], errors="coerce")
            if tenure_num.isna().any():
                report.add_error(
                    f"Column 'tenure' contains {tenure_num.isna().sum()} unparseable non-numeric values."
                )
            else:
                if (tenure_num < 0).any():
                    report.add_error("Column 'tenure' contains negative values.")
                if (tenure_num > 120).any():
                    report.add_warning(
                        f"Column 'tenure' has values > 120 months (10 years): max={tenure_num.max()}."
                    )

        if "MonthlyCharges" in df.columns:
            mc_num = pd.to_numeric(df["MonthlyCharges"], errors="coerce")
            if mc_num.isna().any():
                report.add_error(
                    f"Column 'MonthlyCharges' contains {mc_num.isna().sum()} unparseable non-numeric values."
                )
            else:
                if (mc_num <= 0).any():
                    report.add_error("Column 'MonthlyCharges' contains values <= 0, which are invalid.")

        if "SeniorCitizen" in df.columns:
            sc_unique = set(df["SeniorCitizen"].dropna().unique())
            valid_sc = {"0", "1", 0, 1}
            if not sc_unique.issubset(valid_sc):
                report.add_error(
                    f"Column 'SeniorCitizen' contains values outside {valid_sc}: {sc_unique}"
                )

        # 9. Categorical Values Domain Checks
        for col, expected_domain in EXPECTED_CATEGORICAL_DOMAINS.items():
            if col in df.columns:
                observed_vals = set(df[col].dropna().unique())
                unexpected = observed_vals - expected_domain
                if unexpected:
                    report.add_error(
                        f"Column '{col}' contains unexpected category values: {unexpected}. "
                        f"Expected subset of: {expected_domain}"
                    )

        return report


def validate_file(file_path: str | Path) -> ValidationReport:
    """Convenience entry point to validate a CSV file."""
    validator = DataValidator(file_path)
    return validator.validate()


if __name__ == "__main__":
    import sys

    target_path = Path("ml/data/raw/Telco-Customer-Churn.csv")
    if len(sys.argv) > 1:
        target_path = Path(sys.argv[1])

    print(f"Validating dataset at: {target_path}")
    report = validate_file(target_path)
    print(report.summary())

    if not report.is_valid:
        print("\nValidation FAILED.")
        sys.exit(1)
    else:
        print("\nValidation PASSED successfully.")
        sys.exit(0)
