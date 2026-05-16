from app.services.affordability import (
    calculate_tdsr,
    calculate_msr,
    calculate_ltv,
    calculate_max_loan,
)


class TestCalculateTdsr:
    def test_passes_under_55pct(self):
        result = calculate_tdsr(10_000, 3_000)
        assert result["tdsr_pct"] == 30.0
        assert result["passes"] is True

    def test_fails_over_55pct(self):
        result = calculate_tdsr(10_000, 6_000)
        assert result["tdsr_pct"] == 60.0
        assert result["passes"] is False

    def test_exactly_55pct_passes(self):
        result = calculate_tdsr(10_000, 5_500)
        assert result["passes"] is True

    def test_existing_commitments_add_to_total_debt(self):
        result = calculate_tdsr(10_000, 3_000, existing_monthly_commitments=3_000)
        assert result["tdsr_pct"] == 60.0
        assert result["passes"] is False

    def test_monthly_debt_cap_is_55pct_of_income(self):
        result = calculate_tdsr(10_000, 0)
        assert result["monthly_debt_cap"] == 5_500.0


class TestCalculateMsr:
    def test_passes_under_30pct(self):
        result = calculate_msr(10_000, 2_000)
        assert result["msr_pct"] == 20.0
        assert result["passes"] is True

    def test_fails_over_30pct(self):
        result = calculate_msr(10_000, 4_000)
        assert result["msr_pct"] == 40.0
        assert result["passes"] is False

    def test_payment_cap_is_30pct_of_income(self):
        result = calculate_msr(10_000, 0)
        assert result["monthly_payment_cap"] == 3_000.0


class TestCalculateLtv:
    def test_first_loan_75pct(self):
        assert calculate_ltv(0)["max_ltv"] == 0.75

    def test_second_loan_45pct(self):
        assert calculate_ltv(1)["max_ltv"] == 0.45

    def test_third_loan_35pct(self):
        assert calculate_ltv(2)["max_ltv"] == 0.35

    def test_beyond_third_also_35pct(self):
        assert calculate_ltv(5)["max_ltv"] == 0.35


class TestCalculateMaxLoan:
    def test_ltv_cap_applied_for_high_income(self):
        result = calculate_max_loan(
            price=1_000_000,
            gross_monthly_income=50_000,
            loan_count=0,
            loan_tenure_years=30,
        )
        assert result["max_loan"] <= 750_000
        assert result["is_feasible"] is True

    def test_min_cash_always_5pct_of_price(self):
        result = calculate_max_loan(
            price=1_000_000,
            gross_monthly_income=20_000,
            loan_count=0,
            loan_tenure_years=30,
        )
        assert result["min_cash_portion"] == 50_000.0

    def test_tdsr_reduces_max_loan_when_income_low(self):
        high_income_result = calculate_max_loan(
            price=2_000_000, gross_monthly_income=50_000, loan_count=0, loan_tenure_years=30
        )
        low_income_result = calculate_max_loan(
            price=2_000_000, gross_monthly_income=5_000, loan_count=0, loan_tenure_years=30
        )
        assert low_income_result["max_loan"] < high_income_result["max_loan"]

    def test_hdb_msr_further_constrains_loan(self):
        condo_result = calculate_max_loan(
            price=800_000, gross_monthly_income=8_000, loan_count=0,
            loan_tenure_years=30, is_hdb=False,
        )
        hdb_result = calculate_max_loan(
            price=800_000, gross_monthly_income=8_000, loan_count=0,
            loan_tenure_years=30, is_hdb=True,
        )
        assert hdb_result["max_loan"] <= condo_result["max_loan"]
