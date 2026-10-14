"""
Tests for Health, Model-Info, Metrics, and Insights Endpoints.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify /health returns 200, status=healthy, and model_ready=True."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_ready"] is True
    assert "version" in data
    assert data["artifacts_present"] is True


def test_model_info_endpoint():
    """Verify /model-info returns 200 with schema and metadata."""
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "model_name" in data
    assert data["champion_algorithm"] in ["RandomForest", "LogisticRegression", "HistGradientBoosting"]
    assert len(data["numerical_features"]) == 3
    assert len(data["categorical_features"]) == 16
    assert data["total_features"] == 19


def test_metrics_endpoint():
    """Verify /metrics returns 200 with genuine held-out evaluation metrics."""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "test_metrics" in data
    assert "cross_validation_5fold" in data
    assert "feature_importances" in data
    assert "roc_curve" in data
    assert "precision_recall_curve" in data

    # Verify metric values are within mathematical bounds
    tm = data["test_metrics"]
    assert 0.0 <= tm["roc_auc"] <= 1.0
    assert 0.0 <= tm["accuracy"] <= 1.0
    assert 0.0 <= tm["f1"] <= 1.0
    assert 0.0 <= tm["recall"] <= 1.0


def test_insights_endpoint():
    """Verify /insights returns verified historical dataset distributions."""
    response = client.get("/insights")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset"]["total_customers"] == 7043
    assert data["dataset"]["overall_churn_rate_pct"] == 26.54
    assert len(data["churn_by_contract"]) == 3
