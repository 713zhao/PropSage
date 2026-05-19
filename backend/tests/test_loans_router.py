import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_compare_loans_200():
    resp = client.post("/api/loans/compare", json={
        "loan_amount": 800000,
        "tenure_years": 25,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "packages" in data
    assert len(data["packages"]) == 20
    assert "sora_rate_pct" in data


def test_compare_loans_with_income():
    resp = client.post("/api/loans/compare", json={
        "loan_amount": 500000,
        "tenure_years": 25,
        "gross_monthly_income": 12000,
        "existing_monthly_commitments": 500,
    })
    assert resp.status_code == 200
    data = resp.json()
    for pkg in data["packages"]:
        assert pkg["tdsr_pct"] is not None


def test_compare_loans_invalid_loan_amount():
    resp = client.post("/api/loans/compare", json={"loan_amount": 0})
    assert resp.status_code == 422


def test_refinance_200():
    resp = client.post("/api/loans/refinance", json={
        "current_outstanding": 500000,
        "current_rate_pct": 4.5,
        "remaining_years": 20,
        "penalty_amount": 0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "options" in data
    assert len(data["options"]) == 20
    assert "current_monthly_installment" in data


def test_refinance_invalid_rate():
    resp = client.post("/api/loans/refinance", json={
        "current_outstanding": 500000,
        "current_rate_pct": 25.0,
        "remaining_years": 20,
    })
    assert resp.status_code == 422
