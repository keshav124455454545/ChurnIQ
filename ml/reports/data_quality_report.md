# ChurnIQ — Data Quality & Exploratory Analysis Report

**Project:** ChurnIQ — Enterprise Telco Churn Intelligence  
**Document:** Data Quality & Exploratory Data Analysis Audit Report  
**Dataset:** IBM Telco Customer Churn (`Telco-Customer-Churn.csv`)  
**Status:** Validated, Audited & Cleaned  

---

## 1. Executive Summary & Source Attribution

- **Dataset Name:** IBM Telco Customer Churn
- **Source URL:** [IBM Community Sample Datasets](https://community.ibm.com/community/user/businessanalytics/blogs/steven-macko/2019/07/11/telco-customer-churn-1113) / Kaggle Canonical Mirror (`blastchar/telco-customer-churn`).
- **License / Terms:** IBM Sample Data / Public Domain. Permitted for educational, commercial demonstration, and portfolio benchmarking use.
- **Dataset Dimensions:** 7,043 rows, 21 columns.
- **Target Variable:** `Churn` (Binary categorical: `'No'` [retained], `'Yes'` [churned]).
- **Baseline Churn Rate:** 26.54% (1,869 churned vs. 5,174 retained customers).

---

## 2. Schema Definition & Data Dictionary

| Column Name | Storage Type | Real-World Type | Domain / Range | Description | Modeling Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `customerID` | `object` (str) | Identifier | Alphanumeric (`####-AAAAA`) | Unique customer identifier | **Excluded** (Zero predictive signal; leakage risk) |
| `gender` | `object` (str) | Nominal Categorical | `Male`, `Female` | Customer biological gender | Demographic feature |
| `SeniorCitizen` | `int64` | Binary Flag | `0`, `1` | Indicates age >= 65 years | Demographic feature |
| `Partner` | `object` (str) | Binary Categorical | `Yes`, `No` | Has a relationship partner | Demographic feature |
| `Dependents` | `object` (str) | Binary Categorical | `Yes`, `No` | Lives with dependents / children | Demographic feature |
| `tenure` | `int64` | Continuous Integer | 0 to 72 months | Duration of active relationship | Core account feature |
| `PhoneService` | `object` (str) | Binary Categorical | `Yes`, `No` | Subscribed to landline phone | Subscribed service |
| `MultipleLines` | `object` (str) | Nominal Categorical | `No phone service`, `No`, `Yes` | Multiple landline phone lines | Subscribed service |
| `InternetService`| `object` (str) | Nominal Categorical | `DSL`, `Fiber optic`, `No` | Internet connection medium | Core service feature |
| `OnlineSecurity` | `object` (str) | Nominal Categorical | `No`, `Yes`, `No internet service` | Cyber-security add-on | Service add-on |
| `OnlineBackup` | `object` (str) | Nominal Categorical | `No`, `Yes`, `No internet service` | Cloud backup add-on | Service add-on |
| `DeviceProtection`| `object` (str) | Nominal Categorical | `No`, `Yes`, `No internet service` | Hardware protection plan | Service add-on |
| `TechSupport` | `object` (str) | Nominal Categorical | `No`, `Yes`, `No internet service` | Priority technical support | Service add-on |
| `StreamingTV` | `object` (str) | Nominal Categorical | `No`, `Yes`, `No internet service` | IPTV streaming package | Service add-on |
| `StreamingMovies`| `object` (str) | Nominal Categorical | `No`, `Yes`, `No internet service` | Digital movie streaming | Service add-on |
| `Contract` | `object` (str) | Nominal / Ordinal | `Month-to-month`, `One year`, `Two year` | Commitment term | Core account feature |
| `PaperlessBilling`| `object` (str) | Binary Categorical | `Yes`, `No` | Electronic billing enrollment | Account preference |
| `PaymentMethod` | `object` (str) | Nominal Categorical | `Electronic check`, `Mailed check`, `Bank transfer (auto)`, `Credit card (auto)` | Invoicing settlement method | Core account feature |
| `MonthlyCharges`| `float64` | Continuous Float | $18.25 to $118.75 | Current monthly invoice total | Financial feature |
| `TotalCharges` | `object` -> `float64` | Continuous Float | $0.00 to $8,684.80 | Cumulative lifetime billings | Financial feature |
| `Churn` | `object` (str) | Binary Target | `No`, `Yes` | Whether customer left last month | **Target Label** ($y$) |

---

## 3. Data-Quality Audit Findings

### A. Missing Values and Whitespace Anomalies
1. **Standard `df.isnull()` Check:** Reports **0 missing values** across all 21 columns.
2. **Deep Whitespace Forensic Audit:**
   - Identified **11 rows** where `TotalCharges` contains blank whitespace strings (`" "`).
   - Cross-feature forensic analysis reveals that **all 11 rows have `tenure == 0`**.
   - These customers enrolled during the active billing cycle and have not yet received their first month-end statement.
   - All 11 records have `Churn == 'No'`, with 10 on Two-year contracts and 1 on a One-year contract.
3. **Cleaning Decision:**
   - Non-destructive imputation: Set `TotalCharges = 0.0` for records with `tenure == 0`.
   - Preserves 100% of rows (7,043 intact) without introducing synthetic bias.

### B. Duplicate Record Audit
- **Exact Full-Row Duplicates:** 0 rows.
- **Identifier Uniqueness:** 7,043 unique `customerID` strings matching `^\d{4}-[A-Z]{5}$`.
- **Feature Profile Duplicates:** 22 rows share identical demographic and service attributes across non-ID columns. This is expected given 16 discrete categorical dimensions across 7,043 individuals. All retain distinct `customerID` values.

### C. Out-of-Bounds & Data Type Integrity
- `tenure`: Range [0, 72] months. Valid.
- `MonthlyCharges`: Range [$18.25, $118.75]. All positive. Valid.
- `TotalCharges`: Converted from string to `float64`. Range [$0.00, $8,684.80]. Valid.
- `SeniorCitizen`: Binary values {0, 1}. Valid.
- Categorical Domains: All 16 categorical variables strictly conform to verified domain subsets.

---

## 4. Key Exploratory Data Analysis (EDA) Findings

Every statistic below was computed from the actual dataset:

1. **Contract Term (Strongest Categorical Predictor - Cramér's V = 0.410):**
   - **Month-to-month:** 42.71% churn rate (1,655 / 3,875). Accounts for 88.55% of all churners.
   - **One year:** 11.27% churn rate (166 / 1,473).
   - **Two year:** 2.83% churn rate (48 / 1,695).
2. **Customer Tenure (The "First-Year Cliff" - Pearson $r = -0.352$):**
   - **0–12 Months:** 47.44% churn rate.
   - **13–24 Months:** 28.71% churn rate.
   - **25–48 Months:** 20.39% churn rate.
   - **49–72 Months:** 9.51% churn rate.
   - Median tenure of churned customers is **10 months**, compared to **38 months** for retained customers.
3. **Internet Service Medium (Cramér's V = 0.322):**
   - **Fiber optic:** 41.89% churn rate (1,297 / 3,096).
   - **DSL:** 18.96% churn rate (459 / 2,421).
   - **No internet:** 7.40% churn rate (113 / 1,526).
4. **Payment Method (Cramér's V = 0.303):**
   - **Electronic check:** 45.29% churn rate (1,071 / 2,365).
   - **Mailed check:** 19.11% churn rate (308 / 1,612).
   - **Bank transfer (auto):** 16.71% churn rate (258 / 1,544).
   - **Credit card (auto):** 15.24% churn rate (232 / 1,522).
5. **Charges Breakdown & The Pricing Paradox:**
   - Churned customers pay higher monthly fees: Median **$79.65** vs **$64.43** (Mean: $74.44 vs $61.27).
   - Churned customers have lower total lifetime charges: Median **$703.55** vs **$1,683.60**.
   - *Explanation:* Churned customers leave early in tenure ($TotalCharges \approx MonthlyCharges \times tenure$), preventing lifetime value accumulation.
6. **Zero-Signal Demographic Features:**
   - `gender`: Female churn 26.92%, Male churn 26.16% (Cramér's V = 0.000). Gender provides zero predictive utility.
   - `PhoneService`: Churn rate ~26.7% vs ~24.9% (Cramér's V = 0.001).

---

## 5. Potential Data Leakage & Feature Timing Governance

### Target Leakage Governance
- `Churn`: Must never appear in feature matrices ($X$). It is isolated strictly as $y$.

### Identifier Governance
- `customerID`: High-cardinality unique token. Including it causes decision trees or linear models to memorize hash mappings rather than learn generalizable patterns. Excluded permanently.

### Temporal Availability & Inference Feasibility
- All remaining 19 features represent account status, service configurations, and billing terms available at the moment of evaluation (e.g., month-end risk assessment).
- No post-churn signals (such as cancellation exit survey, return equipment tracking, or termination refunds) are present in this dataset.
- Preprocessing steps (imputers, scalers, encoders) must be strictly fit on training data only inside a `Pipeline` to prevent distributional leakage.

---

## 6. Dataset Limitations & Risks

1. **Cross-Sectional Snapshot:** The dataset represents a single static snapshot rather than a time-series panel. Changes in customer behavior over time are unobserved.
2. **Unobserved Macro Factors:** Competitive offerings, local broadband market dynamics, and customer satisfaction scores (CSAT / NPS) are absent.
3. **Class Imbalance:** 26.54% positive class ratio requires threshold tuning and metric prioritization (Recall, PR-AUC, F1) over standard accuracy.

---

## 7. Next Stage Verification Status

- [x] Raw data intact at `ml/data/raw/Telco-Customer-Churn.csv`.
- [x] Cleaned data verified and saved at `ml/data/processed/telco_churn_cleaned.csv`.
- [x] Reusable validation module implemented (`ml/src/data_validation.py`).
- [x] Reusable preparation module implemented (`ml/src/prepare_data.py`).
- [x] Automated unit tests passing with zero failures (`ml/tests/`).
- [x] EDA notebook generated at `ml/notebooks/01_data_exploration.ipynb`.
- [x] Step 3 ML Pipeline ready for execution.
