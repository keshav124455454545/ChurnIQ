"""
Pydantic Schemas for ChurnIQ Prediction API.
Strict type checking and validation matching the trained model feature schema.
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator
import math


class CustomerInput(BaseModel):
    """Schema for a single customer profile matching the 19 input features."""
    
    # Demographics
    gender: Literal["Female", "Male"] = Field(..., description="Customer biological gender")
    SeniorCitizen: Literal["0", "1", 0, 1] = Field(..., description="Whether customer is a senior citizen (0 or 1)")
    Partner: Literal["Yes", "No"] = Field(..., description="Whether customer has a partner")
    Dependents: Literal["Yes", "No"] = Field(..., description="Whether customer has dependents")
    
    # Account & Billing
    tenure: int = Field(..., ge=0, le=120, description="Months customer has stayed with company")
    Contract: Literal["Month-to-month", "One year", "Two year"] = Field(..., description="Contract term")
    PaperlessBilling: Literal["Yes", "No"] = Field(..., description="Enrolled in paperless billing")
    PaymentMethod: Literal[
        "Electronic check",
        "Mailed check",
        "Bank transfer (automatic)",
        "Credit card (automatic)",
    ] = Field(..., description="Payment method")
    MonthlyCharges: float = Field(..., gt=0, le=500, description="Current monthly charge amount in USD")
    TotalCharges: float = Field(..., ge=0, le=20000, description="Total cumulative charges in USD")
    
    # Services
    PhoneService: Literal["Yes", "No"] = Field(..., description="Landline phone service")
    MultipleLines: Literal["No phone service", "No", "Yes"] = Field(..., description="Multiple phone lines")
    InternetService: Literal["DSL", "Fiber optic", "No"] = Field(..., description="Internet service provider type")
    OnlineSecurity: Literal["No", "Yes", "No internet service"] = Field(..., description="Online security add-on")
    OnlineBackup: Literal["Yes", "No", "No internet service"] = Field(..., description="Online cloud backup add-on")
    DeviceProtection: Literal["No", "Yes", "No internet service"] = Field(..., description="Device protection add-on")
    TechSupport: Literal["No", "Yes", "No internet service"] = Field(..., description="Technical support add-on")
    StreamingTV: Literal["No", "Yes", "No internet service"] = Field(..., description="Streaming TV add-on")
    StreamingMovies: Literal["No", "Yes", "No internet service"] = Field(..., description="Streaming movies add-on")

    @field_validator("MonthlyCharges", "TotalCharges")
    @classmethod
    def validate_finite_floats(cls, v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            raise ValueError("Numeric charges must be finite non-null numbers.")
        return v

    def to_inference_dict(self) -> Dict[str, Any]:
        """Converts to dictionary with standardized SeniorCitizen string for one-hot encoding."""
        data = self.model_dump()
        data["SeniorCitizen"] = str(data["SeniorCitizen"])
        return data


class PredictionResponse(BaseModel):
    """Output prediction and calibrated risk assessment for a single customer."""
    prediction: Literal["Yes", "No"] = Field(..., description="Predicted churn status ('Yes' = Churn, 'No' = Retained)")
    churn_probability: float = Field(..., ge=0.0, le=1.0, description="Model-estimated probability of churn (Positive class)")
    risk_category: Literal["Low", "Medium", "High"] = Field(..., description="Risk tier based on calibrated thresholds")
    model_version: str = Field(..., description="Model version identifier")
    model_algorithm: str = Field(..., description="Machine learning algorithm name")
    threshold_used: float = Field(0.50, description="Decision threshold applied")
    explanation: str = Field(..., description="Business explanation of probability meaning")
    disclaimer: str = Field(
        "This prediction is a statistical estimate based on historical patterns and does not guarantee customer action.",
        description="Model limitation statement",
    )


class BatchPredictionItem(BaseModel):
    """Result for an individual row within a batch prediction request."""
    row_index: int
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    customer_id: Optional[str] = None
    input_data: Optional[Dict[str, Any]] = None
    prediction: Optional[Literal["Yes", "No"]] = None
    churn_probability: Optional[float] = None
    risk_category: Optional[Literal["Low", "Medium", "High"]] = None


class BatchPredictionSummary(BaseModel):
    """Aggregate statistics for batch prediction results."""
    total_records: int
    valid_records: int
    invalid_records: int
    predicted_churn_count: int
    predicted_retained_count: int
    churn_rate_percent: float
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int


class BatchPredictionResponse(BaseModel):
    """Full batch prediction response including summary and row-level items."""
    summary: BatchPredictionSummary
    results: List[BatchPredictionItem]
    model_version: str


class HealthResponse(BaseModel):
    """Service status and model readiness health check."""
    status: Literal["healthy", "degraded", "unhealthy"]
    model_ready: bool
    version: str
    model_name: Optional[str] = None
    artifacts_present: bool


class ModelInfoResponse(BaseModel):
    """Model governance metadata and feature specifications."""
    model_name: str
    version: str
    champion_algorithm: str
    created_at: str
    dataset_source: str
    framework: str
    random_seed: int
    decision_threshold: float
    risk_thresholds: Dict[str, str]
    numerical_features: List[str]
    categorical_features: List[str]
    total_features: int


class EvaluationMetricsResponse(BaseModel):
    """Genuine model evaluation metrics on held-out test data and cross-validation."""
    champion_model: str
    evaluation_split: Dict[str, Any]
    test_metrics: Dict[str, Any]
    cross_validation_5fold: Dict[str, Any]
    feature_importances: List[Dict[str, Any]]
    roc_curve: List[Dict[str, float]]
    precision_recall_curve: List[Dict[str, float]]
