import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_roi_calculate_200():
    resp = client.post("/api/roi/calculate", json={
        "purchase_price": 1_000_000,
        "loan_amount": 750_000,
        "annual_rate_pct": 3.5,
        "tenure_years": 25,
        "hold_years": 5,
        "monthly_rental_sgd": 3000,
        "annual_appreciation_pct": 3.0,
        "annual_expenses_pct": 1.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "yearly" in data
    assert len(data["yearly"]) == 5
    assert "scenarios" in data
    assert len(data["scenarios"]) == 3


def test_roi_calculate_default_fields():
    resp = client.post("/api/roi/calculate", json={
        "purchase_price": 800_000,
        "loan_amount": 600_000,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["down_payment"] == pytest.approx(200_000)


def test_roi_calculate_invalid_price():
    resp = client.post("/api/roi/calculate", json={
        "purchase_price": 0,
        "loan_amount": 0,
    })
    assert resp.status_code == 422


def test_roi_calculate_irr_present():
    resp = client.post("/api/roi/calculate", json={
        "purchase_price": 1_000_000,
        "loan_amount": 750_000,
        "hold_years": 5,
        "monthly_rental_sgd": 3000,
        "annual_appreciation_pct": 3.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "irr_pct" in data
    assert isinstance(data["irr_pct"], float)
