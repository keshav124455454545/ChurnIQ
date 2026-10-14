"""
Tests for Individual Prediction Endpoint POST /predict.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)

VALID_PAYLOAD = {
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


def test_valid_predict_success():
    """Verify POST /predict returns 200 with complete prediction schema."""
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] in ["Yes", "No"]
    assert 0.0 <= data["churn_probability"] <= 1.0
    assert data["risk_category"] in ["Low", "Medium", "High"]
    assert "explanation" in data
    assert "disclaimer" in data
    assert data["threshold_used"] == 0.50


def test_predict_missing_field_rejected():
    """Verify missing required field triggers 422 Validation Error."""
    payload = VALID_PAYLOAD.copy()
    del payload["Contract"]
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    assert "Contract" in response.text


def test_predict_invalid_categorical_rejected():
    """Verify invalid category value triggers 422 Validation Error."""
    payload = VALID_PAYLOAD.copy()
    payload["Contract"] = "Five year"
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_negative_charges_rejected():
    """Verify negative MonthlyCharges triggers 422 Validation Error."""
    payload = VALID_PAYLOAD.copy()
    payload["MonthlyCharges"] = -25.0
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_non_finite_rejected():
    """Verify non-numeric string for charges triggers 422 Validation Error."""
    payload = VALID_PAYLOAD.copy()
    payload["TotalCharges"] = "not_a_number"
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
