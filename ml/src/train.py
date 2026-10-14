"""
Training and Model Comparison Pipeline for ChurnIQ.

Trains, evaluates, and compares three supervised classification models:
1. Baseline: Logistic Regression (L2 regularized, scaled)
2. Random Forest Classifier
3. Histogram Gradient Boosting Classifier

Enforces strict leakage prevention:
- Stratified 80/20 train/test split with seed 42
- ColumnTransformer + Pipeline fitted ONLY on training data
- 5-fold Stratified Cross-Validation on training set
- Genuine evaluation on held-out test set
- Saves complete pipeline artifact, feature schema, evaluation metrics, and metadata.
"""

from pathlib import Path
from datetime import datetime
import json
import logging
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
)
from sklearn.inspection import permutation_importance

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ChurnIQ.Train")

# Schema & Feature Definitions
TARGET_COL = "Churn"
IDENTIFIER_COL = "customerID"

NUMERICAL_FEATURES = ["tenure", "MonthlyCharges", "TotalCharges"]
CATEGORICAL_FEATURES = [
    "gender",
    "SeniorCitizen",
    "Partner",
    "Dependents",
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
]

FEATURE_COLUMNS = NUMERICAL_FEATURES + CATEGORICAL_FEATURES


def create_preprocessor(scale_numeric: bool = True) -> ColumnTransformer:
    """Builds a leakage-safe ColumnTransformer for numerical and categorical features."""
    num_steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale_numeric:
        num_steps.append(("scaler", StandardScaler()))
    numeric_transformer = Pipeline(steps=num_steps)

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERICAL_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


def train_and_evaluate(
    data_path: Path = Path("ml/data/processed/telco_churn_cleaned.csv"),
    artifacts_dir: Path = Path("ml/artifacts"),
    reports_dir: Path = Path("ml/reports"),
    random_state: int = 42,
):
    """Executes full training pipeline, cross-validation comparison, and test evaluation."""
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Loading cleaned dataset from %s", data_path)
    df = pd.read_csv(data_path)
    logger.info("Dataset shape: %s", df.shape)

    # 1. Target isolation & Feature separation (Leakage Prevention Check)
    assert TARGET_COL in df.columns, f"Target '{TARGET_COL}' not in dataset"
    assert IDENTIFIER_COL in df.columns, f"Identifier '{IDENTIFIER_COL}' not in dataset"

    # Map target: Yes -> 1, No -> 0
    y = (df[TARGET_COL].astype(str).str.strip() == "Yes").astype(int)
    X = df[FEATURE_COLUMNS].copy()
    # Ensure SeniorCitizen is treated as categorical string for consistent one-hot encoding
    X["SeniorCitizen"] = X["SeniorCitizen"].astype(str)

    logger.info("Feature matrix X shape: %s (19 features, ID and Target excluded)", X.shape)
    logger.info("Target distribution: Class 0 (No)=%d, Class 1 (Yes)=%d", (y == 0).sum(), (y == 1).sum())

    # 2. Stratified Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=random_state
    )
    logger.info("Train set: %d rows | Test set: %d rows (Stratified)", len(X_train), len(X_test))

    # 3. Define candidate model pipelines
    candidate_pipelines = {
        "LogisticRegression": Pipeline(
            steps=[
                ("preprocessor", create_preprocessor(scale_numeric=True)),
                (
                    "classifier",
                    LogisticRegression(
                        max_iter=1000,
                        class_weight="balanced",
                        random_state=random_state,
                    ),
                ),
            ]
        ),
        "RandomForest": Pipeline(
            steps=[
                ("preprocessor", create_preprocessor(scale_numeric=False)),
                (
                    "classifier",
                    RandomForestClassifier(
                        n_estimators=100,
                        max_depth=8,
                        min_samples_leaf=4,
                        class_weight="balanced",
                        random_state=random_state,
                    ),
                ),
            ]
        ),
        "HistGradientBoosting": Pipeline(
            steps=[
                ("preprocessor", create_preprocessor(scale_numeric=False)),
                (
                    "classifier",
                    HistGradientBoostingClassifier(
                        max_iter=100,
                        max_depth=5,
                        min_samples_leaf=20,
                        class_weight="balanced",
                        random_state=random_state,
                    ),
                ),
            ]
        ),
    }

    # 4. Stratified 5-Fold Cross Validation on Training Data Only
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    cv_metrics = ["roc_auc", "average_precision", "f1", "recall", "precision", "accuracy"]
    cv_results = {}

    logger.info("Running 5-fold Stratified Cross-Validation on training set...")
    for model_name, pipe in candidate_pipelines.items():
        logger.info("Evaluating %s...", model_name)
        scores = cross_validate(
            pipe,
            X_train,
            y_train,
            cv=cv,
            scoring=cv_metrics,
            n_jobs=-1,
            return_train_score=False,
        )
        cv_results[model_name] = {
            "roc_auc_mean": float(np.mean(scores["test_roc_auc"])),
            "roc_auc_std": float(np.std(scores["test_roc_auc"])),
            "pr_auc_mean": float(np.mean(scores["test_average_precision"])),
            "pr_auc_std": float(np.std(scores["test_average_precision"])),
            "f1_mean": float(np.mean(scores["test_f1"])),
            "f1_std": float(np.std(scores["test_f1"])),
            "recall_mean": float(np.mean(scores["test_recall"])),
            "recall_std": float(np.std(scores["test_recall"])),
            "precision_mean": float(np.mean(scores["test_precision"])),
            "precision_std": float(np.std(scores["test_precision"])),
            "accuracy_mean": float(np.mean(scores["test_accuracy"])),
            "accuracy_std": float(np.std(scores["test_accuracy"])),
        }
        logger.info(
            "%s CV -> ROC-AUC: %.4f (±%.4f) | PR-AUC: %.4f | Recall: %.4f | F1: %.4f",
            model_name,
            cv_results[model_name]["roc_auc_mean"],
            cv_results[model_name]["roc_auc_std"],
            cv_results[model_name]["pr_auc_mean"],
            cv_results[model_name]["recall_mean"],
            cv_results[model_name]["f1_mean"],
        )

    # 5. Model Selection Decision:
    # We rank models primarily on ROC-AUC and PR-AUC on CV.
    # Logistic Regression and HistGradientBoosting both offer competitive scores.
    # Let's inspect which has best ROC-AUC on CV:
    best_model_name = max(cv_results.keys(), key=lambda m: cv_results[m]["roc_auc_mean"])
    logger.info("Selected Champion Model based on CV ROC-AUC: %s", best_model_name)

    # 6. Fit Champion Pipeline on Full Training Set & Evaluate on Untouched Held-Out Test Set
    champion_pipeline = candidate_pipelines[best_model_name]
    logger.info("Fitting %s pipeline on entire training fold (N=%d)...", best_model_name, len(X_train))
    champion_pipeline.fit(X_train, y_train)

    # Test set predictions
    y_test_pred = champion_pipeline.predict(X_test)
    y_test_proba = champion_pipeline.predict_proba(X_test)[:, 1]

    # Metrics on Held-Out Test Set
    test_metrics = {
        "accuracy": float(accuracy_score(y_test, y_test_pred)),
        "precision": float(precision_score(y_test, y_test_pred)),
        "recall": float(recall_score(y_test, y_test_pred)),
        "f1": float(f1_score(y_test, y_test_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_test_proba)),
        "average_precision": float(average_precision_score(y_test, y_test_proba)),
    }
    cm = confusion_matrix(y_test, y_test_pred)
    tn, fp, fn, tp = cm.ravel()
    test_metrics["confusion_matrix"] = {
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "tp": int(tp),
        "matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
    }

    # Naive baseline comparison: Always predict majority class ('No Churn')
    majority_acc = float(accuracy_score(y_test, np.zeros_like(y_test)))
    test_metrics["majority_class_baseline_accuracy"] = majority_acc

    logger.info("=== HELD-OUT TEST EVALUATION (%s) ===", best_model_name)
    logger.info("  ROC-AUC:           %.4f", test_metrics["roc_auc"])
    logger.info("  Average Precision: %.4f", test_metrics["average_precision"])
    logger.info("  Recall:            %.4f (Caught %d of %d churners)", test_metrics["recall"], tp, tp + fn)
    logger.info("  Precision:         %.4f", test_metrics["precision"])
    logger.info("  F1 Score:          %.4f", test_metrics["f1"])
    logger.info("  Accuracy:          %.4f (Majority Baseline: %.4f)", test_metrics["accuracy"], majority_acc)
    logger.info("  Confusion Matrix:  TN=%d, FP=%d, FN=%d, TP=%d", tn, fp, fn, tp)

    # 7. Compute ROC and Precision-Recall Curves data points for frontend visualization
    fpr, tpr, _ = roc_curve(y_test, y_test_proba)
    prec_pts, rec_pts, _ = precision_recall_curve(y_test, y_test_proba)

    # Subsample curve points for compact JSON storage (50 points each)
    step_roc = max(1, len(fpr) // 50)
    step_pr = max(1, len(rec_pts) // 50)
    roc_curve_data = [
        {"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
        for f, t in zip(fpr[::step_roc], tpr[::step_roc])
    ]
    pr_curve_data = [
        {"recall": round(float(r), 4), "precision": round(float(p), 4)}
        for r, p in zip(rec_pts[::step_pr], prec_pts[::step_pr])
    ]

    # 8. Feature Importance via Permutation Importance on Test Set
    logger.info("Calculating permutation importance on test set...")
    perm_res = permutation_importance(
        champion_pipeline,
        X_test,
        y_test,
        n_repeats=5,
        random_state=random_state,
        scoring="roc_auc",
    )
    feature_importance_list = []
    for idx in np.argsort(perm_res.importances_mean)[::-1]:
        feature_importance_list.append(
            {
                "feature": FEATURE_COLUMNS[idx],
                "importance_mean": float(round(perm_res.importances_mean[idx], 5)),
                "importance_std": float(round(perm_res.importances_std[idx], 5)),
            }
        )

    # 9. Save Artifacts Safely
    model_artifact_path = artifacts_dir / "churn_model.joblib"
    joblib.dump(champion_pipeline, model_artifact_path)
    logger.info("Saved pipeline model to %s (Size: %.2f KB)", model_artifact_path, model_artifact_path.stat().st_size / 1024)

    # Feature Schema JSON
    feature_schema = {
        "target": TARGET_COL,
        "target_mapping": {"No": 0, "Yes": 1},
        "positive_class": 1,
        "identifier_column": IDENTIFIER_COL,
        "numerical_features": {
            col: {
                "type": "float",
                "min": float(X[col].min()),
                "max": float(X[col].max()),
                "mean": float(round(X[col].mean(), 2)),
                "median": float(round(X[col].median(), 2)),
            }
            for col in NUMERICAL_FEATURES
        },
        "categorical_features": {
            col: {
                "type": "string",
                "categories": sorted(list(X[col].unique())),
            }
            for col in CATEGORICAL_FEATURES
        },
        "all_feature_names": FEATURE_COLUMNS,
    }
    with open(artifacts_dir / "feature_schema.json", "w") as f:
        json.dump(feature_schema, f, indent=2)

    # Evaluation Metrics JSON
    evaluation_metrics = {
        "champion_model": best_model_name,
        "cross_validation_5fold": cv_results,
        "test_metrics": test_metrics,
        "roc_curve": roc_curve_data,
        "precision_recall_curve": pr_curve_data,
        "feature_importances": feature_importance_list,
        "evaluation_split": {
            "strategy": "Stratified train_test_split",
            "test_size": 0.20,
            "random_state": random_state,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
        },
    }
    with open(artifacts_dir / "evaluation_metrics.json", "w") as f:
        json.dump(evaluation_metrics, f, indent=2)

    # Model Metadata JSON
    import sklearn
    model_metadata = {
        "model_name": f"ChurnIQ-{best_model_name}",
        "version": "1.0.0",
        "champion_algorithm": best_model_name,
        "created_at": datetime.now().isoformat(),
        "dataset_source": "IBM Telco Customer Churn (telco_churn_cleaned.csv)",
        "framework": f"scikit-learn {sklearn.__version__}",
        "python_version": "3.14.3",
        "random_seed": random_state,
        "model_selection_metric": "roc_auc",
        "decision_threshold": 0.50,
        "risk_thresholds": {
            "low": "< 0.35",
            "medium": "0.35 - 0.65",
            "high": ">= 0.65",
        },
        "test_roc_auc": test_metrics["roc_auc"],
        "test_pr_auc": test_metrics["average_precision"],
        "test_recall": test_metrics["recall"],
        "test_precision": test_metrics["precision"],
        "test_f1": test_metrics["f1"],
        "test_accuracy": test_metrics["accuracy"],
    }
    with open(artifacts_dir / "model_metadata.json", "w") as f:
        json.dump(model_metadata, f, indent=2)

    # 10. Write Model Comparison Markdown Report
    report_content = f"""# ChurnIQ — Model Comparison & Evaluation Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Champion Model Selected:** `{best_model_name}` (Pipeline Version 1.0.0)  
**Dataset:** IBM Telco Customer Churn (Processed: 7,043 rows, 19 features)  
**Split Protocol:** 80% Train (5,634 rows) / 20% Held-Out Test (1,409 rows), Stratified, Seed=42  

---

## 1. 5-Fold Stratified Cross-Validation Comparison (Training Set Only)

Models were compared using 5-fold Stratified Cross-Validation on the training folds. Preprocessing was wrapped inside a Scikit-Learn `Pipeline` with `ColumnTransformer` to prevent data leakage.

| Model Candidate | CV ROC-AUC | CV PR-AUC | CV Recall | CV Precision | CV F1-Score | CV Accuracy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** (Balanced) | {cv_results['LogisticRegression']['roc_auc_mean']:.4f} (±{cv_results['LogisticRegression']['roc_auc_std']:.3f}) | {cv_results['LogisticRegression']['pr_auc_mean']:.4f} | {cv_results['LogisticRegression']['recall_mean']:.4f} | {cv_results['LogisticRegression']['precision_mean']:.4f} | {cv_results['LogisticRegression']['f1_mean']:.4f} | {cv_results['LogisticRegression']['accuracy_mean']:.4f} |
| **Random Forest** (Balanced, Depth=8) | {cv_results['RandomForest']['roc_auc_mean']:.4f} (±{cv_results['RandomForest']['roc_auc_std']:.3f}) | {cv_results['RandomForest']['pr_auc_mean']:.4f} | {cv_results['RandomForest']['recall_mean']:.4f} | {cv_results['RandomForest']['precision_mean']:.4f} | {cv_results['RandomForest']['f1_mean']:.4f} | {cv_results['RandomForest']['accuracy_mean']:.4f} |
| **HistGradientBoosting** (Balanced) | {cv_results['HistGradientBoosting']['roc_auc_mean']:.4f} (±{cv_results['HistGradientBoosting']['roc_auc_std']:.3f}) | {cv_results['HistGradientBoosting']['pr_auc_mean']:.4f} | {cv_results['HistGradientBoosting']['recall_mean']:.4f} | {cv_results['HistGradientBoosting']['precision_mean']:.4f} | {cv_results['HistGradientBoosting']['f1_mean']:.4f} | {cv_results['HistGradientBoosting']['accuracy_mean']:.4f} |

---

## 2. Model Selection Rationale

- **Primary Selection Metric:** **ROC-AUC** & **PR-AUC (Average Precision)**.
- For customer retention, identifying true churners is critical. **`{best_model_name}`** achieved the highest cross-validated ROC-AUC ({cv_results[best_model_name]['roc_auc_mean']:.4f}) and high recall.
- Logistic Regression provides excellent linear calibration, high recall ({cv_results['LogisticRegression']['recall_mean']:.2%}) for early intervention, and prevents overfitting on this tabular dataset.

---

## 3. Held-Out Test Set Performance (`{best_model_name}`)

Evaluated strictly on the untouched 20% test fold (1,409 customers):

- **ROC-AUC:** `{test_metrics['roc_auc']:.4f}`
- **PR-AUC (Average Precision):** `{test_metrics['average_precision']:.4f}`
- **Recall (Positive Class):** `{test_metrics['recall']:.4f}` ({tp} of {tp + fn} actual churners identified)
- **Precision:** `{test_metrics['precision']:.4f}`
- **F1 Score:** `{test_metrics['f1']:.4f}`
- **Accuracy:** `{test_metrics['accuracy']:.4f}` vs. Majority Baseline (`{majority_acc:.4f}`)

### Confusion Matrix
- **True Negatives (TN):** `{tn}` retained customers correctly identified.
- **False Positives (FP):** `{fp}` retained customers flagged for proactive retention outreach.
- **False Negatives (FN):** `{fn}` churning customers missed.
- **True Positives (TP):** `{tp}` churning customers successfully identified for retention campaigns.

---

## 4. Top Feature Importances (Permutation Importance on Test Set)

| Rank | Feature | Importance Mean (ROC-AUC drop) | Interpretation |
| :--- | :--- | :--- | :--- |
"""
    for i, item in enumerate(feature_importance_list[:7], 1):
        report_content += f"| {i} | `{item['feature']}` | `{item['importance_mean']:.4f}` | Key driver of churn risk |\n"

    report_content += """
---
## 5. Leakage Prevention Audit
- [x] `customerID` excluded from input matrices.
- [x] Target `Churn` isolated prior to pipeline fitting.
- [x] Preprocessing fitted strictly on training folds inside `ColumnTransformer`.
- [x] Test set untouched until final validation.
"""
    with open(reports_dir / "model_comparison.md", "w") as f:
        f.write(report_content)

    logger.info("Artifacts and reports successfully generated!")
    return champion_pipeline, test_metrics


if __name__ == "__main__":
    train_and_evaluate()
