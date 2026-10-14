/**
 * TypeScript Interfaces for ChurnIQ Frontend.
 * Strictly mirrors FastAPI backend schemas and feature definitions.
 */

export interface CustomerInput {
  gender: 'Female' | 'Male';
  SeniorCitizen: '0' | '1' | 0 | 1;
  Partner: 'Yes' | 'No';
  Dependents: 'Yes' | 'No';
  tenure: number;
  PhoneService: 'Yes' | 'No';
  MultipleLines: 'No phone service' | 'No' | 'Yes';
  InternetService: 'DSL' | 'Fiber optic' | 'No';
  OnlineSecurity: 'No' | 'Yes' | 'No internet service';
  OnlineBackup: 'Yes' | 'No' | 'No internet service';
  DeviceProtection: 'No' | 'Yes' | 'No internet service';
  TechSupport: 'No' | 'Yes' | 'No internet service';
  StreamingTV: 'No' | 'Yes' | 'No internet service';
  StreamingMovies: 'No' | 'Yes' | 'No internet service';
  Contract: 'Month-to-month' | 'One year' | 'Two year';
  PaperlessBilling: 'Yes' | 'No';
  PaymentMethod:
    | 'Electronic check'
    | 'Mailed check'
    | 'Bank transfer (automatic)'
    | 'Credit card (automatic)';
  MonthlyCharges: number;
  TotalCharges: number;
}

export interface PredictionResponse {
  prediction: 'Yes' | 'No';
  churn_probability: number;
  risk_category: 'Low' | 'Medium' | 'High';
  model_version: string;
  model_algorithm: string;
  threshold_used: number;
  explanation: string;
  disclaimer: string;
}

export interface BatchPredictionItem {
  row_index: number;
  is_valid: boolean;
  errors: string[];
  customer_id?: string | null;
  input_data?: Record<string, any>;
  prediction?: 'Yes' | 'No' | null;
  churn_probability?: number | null;
  risk_category?: 'Low' | 'Medium' | 'High' | null;
}

export interface BatchPredictionSummary {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  predicted_churn_count: number;
  predicted_retained_count: number;
  churn_rate_percent: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export interface BatchPredictionResponse {
  summary: BatchPredictionSummary;
  results: BatchPredictionItem[];
  model_version: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  model_ready: boolean;
  version: string;
  model_name?: string | null;
  artifacts_present: boolean;
}

export interface ModelInfoResponse {
  model_name: string;
  version: string;
  champion_algorithm: string;
  created_at: string;
  dataset_source: string;
  framework: string;
  random_seed: number;
  decision_threshold: number;
  risk_thresholds: Record<string, string>;
  numerical_features: string[];
  categorical_features: string[];
  total_features: number;
}

export interface EvaluationMetricsResponse {
  champion_model: string;
  evaluation_split: {
    strategy: string;
    test_size: number;
    random_state: number;
    train_samples: number;
    test_samples: number;
  };
  test_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
    average_precision: number;
    majority_class_baseline_accuracy: number;
    confusion_matrix: {
      tn: number;
      fp: number;
      fn: number;
      tp: number;
      matrix: number[][];
    };
  };
  cross_validation_5fold: Record<
    string,
    {
      roc_auc_mean: number;
      roc_auc_std: number;
      pr_auc_mean: number;
      recall_mean: number;
      precision_mean: number;
      f1_mean: number;
      accuracy_mean: number;
    }
  >;
  feature_importances: Array<{
    feature: string;
    importance_mean: number;
    importance_std: number;
  }>;
  roc_curve: Array<{ fpr: number; tpr: number }>;
  precision_recall_curve: Array<{ recall: number; precision: number }>;
}

export interface InsightsResponse {
  dataset: {
    name: string;
    total_customers: number;
    overall_churn_rate_pct: number;
    retained_customers: number;
    churned_customers: number;
  };
  churn_by_contract: Array<{
    contract: string;
    total: number;
    churned: number;
    churn_rate_pct: number;
  }>;
  churn_by_internet: Array<{
    service: string;
    total: number;
    churned: number;
    churn_rate_pct: number;
  }>;
  churn_by_payment: Array<{
    method: string;
    total: number;
    churned: number;
    churn_rate_pct: number;
  }>;
  churn_by_tenure_cohort: Array<{
    cohort: string;
    churn_rate_pct: number;
  }>;
}
