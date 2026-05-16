from fastapi.testclient import TestClient
from app.main import app


class TestTaxRouter:
    def test_upfront_cost_sc_first_property(self, client):
        response = client.post("/api/tax/upfront-cost", json={
            "purchase_price": 1_000_000,
            "citizenship": "SC",
            "existing_property_count": 0,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["bsd"] == 24_600.0
        assert data["absd"] == 0.0
        assert data["total_cash_outlay"] == 1_038_100.0

    def test_upfront_cost_foreigner_high_absd(self, client):
        response = client.post("/api/tax/upfront-cost", json={
            "purchase_price": 1_000_000,
            "citizenship": "Foreigner",
            "existing_property_count": 0,
        })
        assert response.status_code == 200
        assert response.json()["absd"] == 600_000.0

    def test_ssd_within_one_year(self, client):
        response = client.post("/api/tax/ssd", json={
            "purchase_price": 1_000_000,
            "hold_years": 0.5,
        })
        assert response.status_code == 200
        assert response.json()["ssd"] == 120_000.0

    def test_ssd_beyond_three_years_zero(self, client):
        response = client.post("/api/tax/ssd", json={
            "purchase_price": 1_000_000,
            "hold_years": 5.0,
        })
        assert response.status_code == 200
        assert response.json()["ssd"] == 0.0

    def test_missing_required_field_returns_422(self, client):
        response = client.post("/api/tax/upfront-cost", json={
            "purchase_price": 1_000_000,
        })
        assert response.status_code == 422

    def test_invalid_citizenship_returns_422(self, client):
        response = client.post("/api/tax/upfront-cost", json={
            "purchase_price": 1_000_000,
            "citizenship": "Alien",
            "existing_property_count": 0,
        })
        assert response.status_code == 422

    def test_ssd_exactly_one_year(self, client):
        response = client.post("/api/tax/ssd", json={
            "purchase_price": 1_000_000,
            "hold_years": 1.0,
        })
        assert response.status_code == 200
        assert response.json()["ssd"] == 120_000.0

    def test_ssd_exactly_three_years(self, client):
        response = client.post("/api/tax/ssd", json={
            "purchase_price": 1_000_000,
            "hold_years": 3.0,
        })
        assert response.status_code == 200
        assert response.json()["ssd"] == 40_000.0


class TestProfileRouter:
    def test_affordability_feasible(self, client):
        response = client.post("/api/profile/affordability", json={
            "purchase_price": 1_000_000,
            "gross_monthly_income": 15_000,
            "loan_tenure_years": 30,
            "existing_loan_count": 0,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["is_feasible"] is True
        assert data["max_loan"] > 0
        assert data["min_cash_portion"] == 50_000.0

    def test_affordability_hdb_returns_msr(self, client):
        response = client.post("/api/profile/affordability", json={
            "purchase_price": 500_000,
            "gross_monthly_income": 8_000,
            "loan_tenure_years": 25,
            "existing_loan_count": 0,
            "is_hdb": True,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["msr_pct"] is not None

    def test_affordability_non_hdb_msr_is_null(self, client):
        response = client.post("/api/profile/affordability", json={
            "purchase_price": 1_000_000,
            "gross_monthly_income": 10_000,
            "loan_tenure_years": 30,
            "existing_loan_count": 0,
            "is_hdb": False,
        })
        assert response.status_code == 200
        assert response.json()["msr_pct"] is None

    def test_affordability_tdsr_passes(self, client):
        response = client.post("/api/profile/affordability", json={
            "purchase_price": 1_000_000,
            "gross_monthly_income": 15_000,
            "loan_tenure_years": 30,
            "existing_loan_count": 0,
        })
        assert response.status_code == 200
        assert response.json()["tdsr_passes"] is True

    def test_zero_loan_tenure_returns_422(self, client):
        response = client.post("/api/profile/affordability", json={
            "purchase_price": 1_000_000,
            "gross_monthly_income": 15_000,
            "loan_tenure_years": 0,
            "existing_loan_count": 0,
        })
        assert response.status_code == 422
