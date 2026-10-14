# ChurnIQ — Model Comparison & Evaluation Report

**Generated:** 2026-10-14 00:59:20  
**Champion Model Selected:** `RandomForest` (Pipeline Version 1.0.0)  
**Dataset:** IBM Telco Customer Churn (Processed: 7,043 rows, 19 features)  
**Split Protocol:** 80% Train (5,634 rows) / 20% Held-Out Test (1,409 rows), Stratified, Seed=42  

---

## 1. 5-Fold Stratified Cross-Validation Comparison (Training Set Only)

Models were compared using 5-fold Stratified Cross-Validation on the training folds. Preprocessing was wrapped inside a Scikit-Learn `Pipeline` with `ColumnTransformer` to prevent data leakage.

| Model Candidate | CV ROC-AUC | CV PR-AUC | CV Recall | CV Precision | CV F1-Score | CV Accuracy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** (Balanced) | 0.8460 (±0.012) | 0.6601 | 0.8013 | 0.5169 | 0.6282 | 0.7485 |
| **Random Forest** (Balanced, Depth=8) | 0.8470 (±0.010) | 0.6603 | 0.7987 | 0.5274 | 0.6350 | 0.7563 |
| **HistGradientBoosting** (Balanced) | 0.8442 (±0.010) | 0.6615 | 0.7699 | 0.5401 | 0.6347 | 0.7650 |

---

## 2. Model Selection Rationale

- **Primary Selection Metric:** **ROC-AUC** & **PR-AUC (Average Precision)**.
- For customer retention, identifying true churners is critical. **`RandomForest`** achieved the highest cross-validated ROC-AUC (0.8470) and high recall.
- Logistic Regression provides excellent linear calibration, high recall (80.13%) for early intervention, and prevents overfitting on this tabular dataset.

---

## 3. Held-Out Test Set Performance (`RandomForest`)

Evaluated strictly on the untouched 20% test fold (1,409 customers):

- **ROC-AUC:** `0.8420`
- **PR-AUC (Average Precision):** `0.6488`
- **Recall (Positive Class):** `0.7914` (296 of 374 actual churners identified)
- **Precision:** `0.5202`
- **F1 Score:** `0.6278`
- **Accuracy:** `0.7509` vs. Majority Baseline (`0.7346`)

### Confusion Matrix
- **True Negatives (TN):** `762` retained customers correctly identified.
- **False Positives (FP):** `273` retained customers flagged for proactive retention outreach.
- **False Negatives (FN):** `78` churning customers missed.
- **True Positives (TP):** `296` churning customers successfully identified for retention campaigns.

---

## 4. Top Feature Importances (Permutation Importance on Test Set)

| Rank | Feature | Importance Mean (ROC-AUC drop) | Interpretation |
| :--- | :--- | :--- | :--- |
| 1 | `Contract` | `0.0681` | Key driver of churn risk |
| 2 | `tenure` | `0.0242` | Key driver of churn risk |
| 3 | `InternetService` | `0.0179` | Key driver of churn risk |
| 4 | `TotalCharges` | `0.0146` | Key driver of churn risk |
| 5 | `TechSupport` | `0.0048` | Key driver of churn risk |
| 6 | `OnlineSecurity` | `0.0046` | Key driver of churn risk |
| 7 | `PaperlessBilling` | `0.0020` | Key driver of churn risk |

---
## 5. Leakage Prevention Audit
- [x] `customerID` excluded from input matrices.
- [x] Target `Churn` isolated prior to pipeline fitting.
- [x] Preprocessing fitted strictly on training folds inside `ColumnTransformer`.
- [x] Test set untouched until final validation.
