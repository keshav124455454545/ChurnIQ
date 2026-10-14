"""
Tests for Batch Prediction Endpoint POST /predict-batch.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)

SAMPLE_ROW_1 = {
    "customerID": "7590-VHVEG",
    "gender": "Female",
    "SeniorCitizen": "0",
    "Partner": "Yes",
    "Dependents": "No",
    "tenure": 1,
    "PhoneService": "No",
    "MultipleLines": "No phone service",
    "InternetService": "DSL",
    "OnlineSecurity": "No",
    "OnlineBackup": "Yes",
    "DeviceProtection": "No",
    "TechSupport": "No",
    "StreamingTV": "No",
    "StreamingMovies": "No",
    "Contract": "Month-to-month",
    "PaperlessBilling": "Yes",
    "PaymentMethod": "Electronic check",
    "MonthlyCharges": 29.85,
    "TotalCharges": 29.85,
}

SAMPLE_ROW_2 = {
    "customerID": "5575-GNVDE",
    "gender": "Male",
    "SeniorCitizen": "0",
    "Partner": "No",
    "Dependents": "No",
    "tenure": 34,
    "PhoneService": "Yes",
    "MultipleLines": "No",
    "InternetService": "DSL",
    "OnlineSecurity": "Yes",
    "OnlineBackup": "No",
    "DeviceProtection": "Yes",
    "TechSupport": "No",
    "StreamingTV": "No",
    "StreamingMovies": "No",
    "Contract": "One year",
    "PaperlessBilling": "No",
    "PaymentMethod": "Mailed check",
    "MonthlyCharges": 56.95,
    "TotalCharges": 1889.5,
}


def test_batch_predict_success():
    """Verify POST /predict-batch processes rows and generates summary."""
    response = client.post("/predict-batch", json=[SAMPLE_ROW_1, SAMPLE_ROW_2])
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total_records"] == 2
    assert data["summary"]["valid_records"] == 2
    assert data["summary"]["invalid_records"] == 0
    assert len(data["results"]) == 2
    assert data["results"][0]["customer_id"] == "7590-VHVEG"
    assert data["results"][1]["customer_id"] == "5575-GNVDE"


def test_batch_single_consistency():
    """Verify single and batch inference produce identical predictions and probabilities."""
    single_res = client.post("/predict", json=SAMPLE_ROW_1).json()
    batch_res = client.post("/predict-batch", json=[SAMPLE_ROW_1]).json()

    assert batch_res["results"][0]["prediction"] == single_res["prediction"]
    assert batch_res["results"][0]["churn_probability"] == single_res["churn_probability"]
    assert batch_res["results"][0]["risk_category"] == single_res["risk_category"]


def test_batch_empty_rejected():
    """Verify empty list triggers 400 Bad Request."""
    response = client.post("/predict-batch", json=[])
    assert response.status_code == 400
    assert "empty" in response.text.lower()


def test_batch_mixed_validation_handling():
    """Verify batch handles partially corrupted records gracefully without crashing."""
    corrupted_row = SAMPLE_ROW_1.copy()
    corrupted_row["MonthlyCharges"] = -100.0  # Invalid
    corrupted_row["customerID"] = "BAD-ROW-99"

    response = client.post("/predict-batch", json=[SAMPLE_ROW_1, corrupted_row])
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total_records"] == 2
    assert data["summary"]["valid_records"] == 1
    assert data["summary"]["invalid_records"] == 1

    # First row valid
    assert data["results"][0]["is_valid"] is True
    # Second row invalid with error message
    assert data["results"][1]["is_valid"] is False
    assert len(data["results"][1]["errors"]) > 0
    assert data["results"][1]["customer_id"] == "BAD-ROW-99"


def test_batch_oversized_rejected():
    """Verify batch exceeding 500 rows triggers 413 Payload Too Large."""
    huge_batch = [SAMPLE_ROW_1] * 501
    response = client.post("/predict-batch", json=huge_batch)
    assert response.status_code == 413
