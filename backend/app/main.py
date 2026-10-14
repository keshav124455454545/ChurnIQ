"""
ChurnIQ FastAPI Prediction Backend Application.
"""

from typing import Any, Dict, List
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.model_loader import model_service
from app.schemas import (
    CustomerInput,
    PredictionResponse,
    BatchPredictionResponse,
    HealthResponse,
    ModelInfoResponse,
    EvaluationMetricsResponse,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ChurnIQ.API")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event to verify model readiness on startup."""
    logger.info("Initializing ChurnIQ API backend...")
    if model_service.is_ready:
        logger.info("Model service is active and ready for inference.")
    else:
        logger.warning("Model service initialized in DEGRADED state: %s", model_service.error_message)
    yield
    logger.info("Shutting down ChurnIQ API backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production Supervised Machine Learning API for Telco Customer Churn Prediction.",
    lifespan=lifespan,
)

# CORS Middleware
is_wildcard = "*" in settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler for unhandled errors (Sanitizes response, logs server-side)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing request %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred while processing the request."},
    )


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def get_health():
    """Returns service health status and model readiness."""
    artifacts_exist = (
        (settings.ARTIFACTS_DIR / "churn_model.joblib").exists()
        and (settings.ARTIFACTS_DIR / "feature_schema.json").exists()
    )
    
    if not model_service.is_ready:
        return HealthResponse(
            status="degraded",
            model_ready=False,
            version=settings.VERSION,
            model_name=None,
            artifacts_present=artifacts_exist,
        )

    return HealthResponse(
        status="healthy",
        model_ready=True,
        version=settings.VERSION,
        model_name=model_service.metadata.get("model_name"),
        artifacts_present=True,
    )


@app.get("/model-info", response_model=ModelInfoResponse, tags=["Model Governance"])
async def get_model_info():
    """Returns model metadata, feature specification, and training documentation."""
    if not model_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model artifacts are not loaded or ready.",
        )

    meta = model_service.metadata
    schema = model_service.schema

    return ModelInfoResponse(
        model_name=meta.get("model_name", "ChurnIQ-Model"),
        version=meta.get("version", "1.0.0"),
        champion_algorithm=meta.get("champion_algorithm", "Unknown"),
        created_at=meta.get("created_at", ""),
        dataset_source=meta.get("dataset_source", "IBM Telco Customer Churn"),
        framework=meta.get("framework", "scikit-learn"),
        random_seed=meta.get("random_seed", 42),
        decision_threshold=meta.get("decision_threshold", 0.50),
        risk_thresholds=meta.get("risk_thresholds", {}),
        numerical_features=list(schema.get("numerical_features", {}).keys()),
        categorical_features=list(schema.get("categorical_features", {}).keys()),
        total_features=len(schema.get("all_feature_names", [])),
    )


@app.get("/metrics", response_model=EvaluationMetricsResponse, tags=["Model Governance"])
async def get_evaluation_metrics():
    """Returns genuine held-out test evaluation results, cross-validation metrics, and curves."""
    if not model_service.is_ready or not model_service.evaluation_metrics:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Evaluation metrics are not loaded or ready.",
        )

    em = model_service.evaluation_metrics
    return EvaluationMetricsResponse(
        champion_model=em.get("champion_model", ""),
        evaluation_split=em.get("evaluation_split", {}),
        test_metrics=em.get("test_metrics", {}),
        cross_validation_5fold=em.get("cross_validation_5fold", {}),
        feature_importances=em.get("feature_importances", []),
        roc_curve=em.get("roc_curve", []),
        precision_recall_curve=em.get("precision_recall_curve", []),
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
async def predict_churn(customer: CustomerInput):
    """Performs inference for an individual customer using the verified ML pipeline."""
    if not model_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Inference model is currently unavailable.",
        )
    try:
        return model_service.predict_single(customer)
    except Exception as exc:
        logger.error("Error during single prediction: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@app.post("/predict-batch", response_model=BatchPredictionResponse, tags=["Inference"])
async def predict_batch_churn(records: List[Dict[str, Any]]):
    """Processes batch inference for multiple customer records with detailed error tracking."""
    if not model_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Inference model is currently unavailable.",
        )

    if len(records) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch list cannot be empty. Please submit at least one customer record.",
        )

    if len(records) > settings.MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Batch size {len(records)} exceeds maximum allowed limit of {settings.MAX_BATCH_SIZE}.",
        )

    try:
        return model_service.predict_batch(records)
    except Exception as exc:
        logger.error("Error during batch prediction: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@app.get("/insights", tags=["Analytics"])
async def get_insights():
    """Provides genuine historical EDA summary statistics computed from the IBM dataset."""
    return {
        "dataset": {
            "name": "IBM Telco Customer Churn",
            "total_customers": 7043,
            "overall_churn_rate_pct": 26.54,
            "retained_customers": 5174,
            "churned_customers": 1869,
        },
        "churn_by_contract": [
            {"contract": "Month-to-month", "total": 3875, "churned": 1655, "churn_rate_pct": 42.71},
            {"contract": "One year", "total": 1473, "churned": 166, "churn_rate_pct": 11.27},
            {"contract": "Two year", "total": 1695, "churned": 48, "churn_rate_pct": 2.83},
        ],
        "churn_by_internet": [
            {"service": "Fiber optic", "total": 3096, "churned": 1297, "churn_rate_pct": 41.89},
            {"service": "DSL", "total": 2421, "churned": 459, "churn_rate_pct": 18.96},
            {"service": "No internet", "total": 1526, "churned": 113, "churn_rate_pct": 7.40},
        ],
        "churn_by_payment": [
            {"method": "Electronic check", "total": 2365, "churned": 1071, "churn_rate_pct": 45.29},
            {"method": "Mailed check", "total": 1612, "churned": 308, "churn_rate_pct": 19.11},
            {"method": "Bank transfer (auto)", "total": 1544, "churned": 258, "churn_rate_pct": 16.71},
            {"method": "Credit card (auto)", "total": 1522, "churned": 232, "churn_rate_pct": 15.24},
        ],
        "churn_by_tenure_cohort": [
            {"cohort": "0-12 Months", "churn_rate_pct": 47.44},
            {"cohort": "13-24 Months", "churn_rate_pct": 28.71},
            {"cohort": "25-48 Months", "churn_rate_pct": 20.39},
            {"cohort": "49-72 Months", "churn_rate_pct": 9.51},
        ],
    }
