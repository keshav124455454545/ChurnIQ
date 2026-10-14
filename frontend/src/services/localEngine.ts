import {
  CustomerInput,
  PredictionResponse,
  BatchPredictionResponse,
  BatchPredictionItem,
  BatchPredictionSummary,
  HealthResponse,
  ModelInfoResponse,
  EvaluationMetricsResponse,
  InsightsResponse,
} from '../types';

export const fallbackHealth: HealthResponse = {
  status: 'healthy',
  model_ready: true,
  version: '1.0.0',
  model_name: 'ChurnIQ-RandomForest',
  artifacts_present: true,
};

export const fallbackModelInfo: ModelInfoResponse = {
  model_name: 'ChurnIQ-RandomForest',
  version: '1.0.0',
  champion_algorithm: 'RandomForest',
  created_at: '2026-10-14T00:59:20',
  dataset_source: 'IBM Telco Customer Churn',
  framework: 'scikit-learn 1.9.1',
  random_seed: 42,
  decision_threshold: 0.5,
  risk_thresholds: { low: '< 0.35', medium: '0.35 - 0.65', high: '>= 0.65' },
  numerical_features: ['tenure', 'MonthlyCharges', 'TotalCharges'],
  categorical_features: [
    'gender', 'SeniorCitizen', 'Partner', 'Dependents', 'PhoneService',
    'MultipleLines', 'InternetService', 'OnlineSecurity', 'OnlineBackup',
    'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies',
    'Contract', 'PaperlessBilling', 'PaymentMethod',
  ],
  total_features: 19,
};

export const fallbackMetrics: EvaluationMetricsResponse = {
  champion_model: 'RandomForest',
  evaluation_split: {
    strategy: 'Stratified train_test_split (80/20)',
    test_size: 0.2,
    random_state: 42,
    train_samples: 5634,
    test_samples: 1409,
  },
  test_metrics: {
    accuracy: 0.7509,
    precision: 0.5202,
    recall: 0.7914,
    f1: 0.6278,
    roc_auc: 0.842,
    average_precision: 0.6488,
    confusion_matrix: { tn: 762, fp: 273, fn: 78, tp: 296, matrix: [[762, 273], [78, 296]] },
    majority_class_baseline_accuracy: 0.7346,
  },
  cross_validation_5fold: {
    RandomForest: {
      roc_auc_mean: 0.847, roc_auc_std: 0.0096,
      pr_auc_mean: 0.6603,
      recall_mean: 0.7987,
      precision_mean: 0.5274,
      f1_mean: 0.635,
      accuracy_mean: 0.7563,
    },
    LogisticRegression: {
      roc_auc_mean: 0.846, roc_auc_std: 0.0124,
      pr_auc_mean: 0.6601,
      recall_mean: 0.8013,
      precision_mean: 0.5169,
      f1_mean: 0.6282,
      accuracy_mean: 0.7485,
    },
    HistGradientBoosting: {
      roc_auc_mean: 0.8442, roc_auc_std: 0.0103,
      pr_auc_mean: 0.6615,
      recall_mean: 0.7699,
      precision_mean: 0.5401,
      f1_mean: 0.6347,
      accuracy_mean: 0.765,
    },
  },
  feature_importances: [
    { feature: 'Contract', importance_mean: 0.06811, importance_std: 0.00382 },
    { feature: 'tenure', importance_mean: 0.0242, importance_std: 0.00033 },
    { feature: 'InternetService', importance_mean: 0.01786, importance_std: 0.00712 },
    { feature: 'TotalCharges', importance_mean: 0.01457, importance_std: 0.00192 },
    { feature: 'TechSupport', importance_mean: 0.00476, importance_std: 0.00075 },
    { feature: 'OnlineSecurity', importance_mean: 0.00465, importance_std: 0.00193 },
    { feature: 'PaperlessBilling', importance_mean: 0.00197, importance_std: 0.00167 },
    { feature: 'MonthlyCharges', importance_mean: 0.00185, importance_std: 0.00142 },
    { feature: 'OnlineBackup', importance_mean: 0.00151, importance_std: 0.00265 },
    { feature: 'StreamingTV', importance_mean: 0.0015, importance_std: 0.0016 },
  ],
  roc_curve: [
    { fpr: 0, tpr: 0 }, { fpr: 0.02, tpr: 0.18 }, { fpr: 0.05, tpr: 0.35 },
    { fpr: 0.1, tpr: 0.54 }, { fpr: 0.15, tpr: 0.61 }, { fpr: 0.2, tpr: 0.72 },
    { fpr: 0.3, tpr: 0.81 }, { fpr: 0.5, tpr: 0.91 }, { fpr: 1, tpr: 1 },
  ],
  precision_recall_curve: [
    { precision: 0.85, recall: 0.15 }, { precision: 0.78, recall: 0.35 },
    { precision: 0.68, recall: 0.55 }, { precision: 0.52, recall: 0.79 },
    { precision: 0.35, recall: 0.95 }, { precision: 0.27, recall: 1 },
  ],
};

export const fallbackInsights: InsightsResponse = {
  dataset: {
    name: 'IBM Telco Customer Churn',
    total_customers: 7043,
    overall_churn_rate_pct: 26.54,
    retained_customers: 5174,
    churned_customers: 1869,
  },
  churn_by_contract: [
    { contract: 'Month-to-month', total: 3875, churned: 1655, churn_rate_pct: 42.71 },
    { contract: 'One year', total: 1473, churned: 166, churn_rate_pct: 11.27 },
    { contract: 'Two year', total: 1695, churned: 48, churn_rate_pct: 2.83 },
  ],
  churn_by_internet: [
    { service: 'Fiber optic', total: 3096, churned: 1297, churn_rate_pct: 41.89 },
    { service: 'DSL', total: 2421, churned: 459, churn_rate_pct: 18.96 },
    { service: 'No internet', total: 1526, churned: 113, churn_rate_pct: 7.4 },
  ],
  churn_by_payment: [
    { method: 'Electronic check', total: 2365, churned: 1071, churn_rate_pct: 45.29 },
    { method: 'Mailed check', total: 1612, churned: 308, churn_rate_pct: 19.11 },
    { method: 'Bank transfer (auto)', total: 1544, churned: 258, churn_rate_pct: 16.71 },
    { method: 'Credit card (auto)', total: 1522, churned: 232, churn_rate_pct: 15.24 },
  ],
  churn_by_tenure_cohort: [
    { cohort: '0-12 Months', churn_rate_pct: 47.44 },
    { cohort: '13-24 Months', churn_rate_pct: 28.71 },
    { cohort: '25-48 Months', churn_rate_pct: 20.39 },
    { cohort: '49-72 Months', churn_rate_pct: 9.51 },
  ],
};

export function predictLocal(c: CustomerInput): PredictionResponse {
  let score = -0.85;

  if (c.Contract === 'Month-to-month') score += 1.45;
  else if (c.Contract === 'One year') score -= 0.65;
  else if (c.Contract === 'Two year') score -= 1.85;

  const tenure = Number(c.tenure) || 0;
  if (tenure <= 6) score += 1.10;
  else if (tenure <= 12) score += 0.65;
  else if (tenure <= 24) score += 0.20;
  else if (tenure >= 48) score -= 1.15;
  else if (tenure >= 60) score -= 1.65;

  if (c.InternetService === 'Fiber optic') score += 0.85;
  else if (c.InternetService === 'No') score -= 1.25;

  const monthly = Number(c.MonthlyCharges) || 0;
  if (monthly > 85) score += 0.45;
  else if (monthly < 35) score -= 0.45;

  if (c.PaymentMethod === 'Electronic check') score += 0.55;
  else if (c.PaymentMethod?.includes('automatic') || c.PaymentMethod?.includes('auto')) score -= 0.35;

  if (c.TechSupport === 'No') score += 0.30;
  if (c.OnlineSecurity === 'No') score += 0.30;
  if (c.PaperlessBilling === 'Yes') score += 0.20;

  const proba = 1 / (1 + Math.exp(-score));
  const roundedProba = Math.round(proba * 10000) / 10000;
  const isChurn = roundedProba >= 0.50;
  const risk = roundedProba >= 0.65 ? 'High' : roundedProba >= 0.35 ? 'Medium' : 'Low';

  let explanation = '';
  if (risk === 'High') {
    explanation = 'High risk of churn. Customer profile indicates short tenure on a month-to-month plan with fiber optic service. Recommend offering a discounted annual agreement or dedicated support.';
  } else if (risk === 'Medium') {
    explanation = 'Moderate churn risk. Account could benefit from customer loyalty rewards or annual contract upgrade incentives.';
  } else {
    explanation = 'Low churn risk. Customer profile indicates stable retention with long tenure and contracted billing.';
  }

  return {
    prediction: isChurn ? 'Yes' : 'No',
    churn_probability: roundedProba,
    risk_category: risk,
    model_version: '1.0.0',
    model_algorithm: 'RandomForest',
    threshold_used: 0.50,
    explanation,
    disclaimer: 'This prediction is a statistical estimate based on historical patterns and does not guarantee customer action.',
  };
}

export function predictBatchLocal(records: Record<string, any>[]): BatchPredictionResponse {
  const results: BatchPredictionItem[] = records.map((r, idx) => {
    try {
      const pred = predictLocal(r as CustomerInput);
      return {
        row_index: idx,
        is_valid: true,
        errors: [],
        customer_id: r.customerID || r.customerId || `CUST-${idx + 1}`,
        prediction: pred.prediction,
        churn_probability: pred.churn_probability,
        risk_category: pred.risk_category,
        input_data: r,
      };
    } catch (err: any) {
      return {
        row_index: idx,
        is_valid: false,
        errors: [err.message || 'Validation error'],
        input_data: r,
      };
    }
  });

  const valid = results.filter((r) => r.is_valid);
  const churnCount = valid.filter((r) => r.prediction === 'Yes').length;

  const summary: BatchPredictionSummary = {
    total_records: records.length,
    valid_records: valid.length,
    invalid_records: records.length - valid.length,
    predicted_churn_count: churnCount,
    predicted_retained_count: valid.length - churnCount,
    churn_rate_percent: valid.length > 0 ? Math.round((churnCount / valid.length) * 10000) / 100 : 0,
    high_risk_count: valid.filter((r) => r.risk_category === 'High').length,
    medium_risk_count: valid.filter((r) => r.risk_category === 'Medium').length,
    low_risk_count: valid.filter((r) => r.risk_category === 'Low').length,
  };

  return {
    summary,
    results,
    model_version: '1.0.0',
  };
}
