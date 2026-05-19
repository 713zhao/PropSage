import pytest
from app.services.loans import get_sora_rate, compare_loans, calculate_refinancing
from app.schemas.loans import LoanComparisonRequest, RefinancingRequest


def test_get_sora_rate_returns_float():
    rate = get_sora_rate()
    assert isinstance(rate, float)
    assert 0.0 < rate < 10.0


def test_compare_loans_returns_20_packages():
    req = LoanComparisonRequest(loan_amount=800_000, tenure_years=25)
    resp = compare_loans(req)
    assert len(resp.packages) == 20
    assert resp.sora_rate_pct == pytest.approx(3.68)


def test_compare_loans_sorted_by_installment():
    req = LoanComparisonRequest(loan_amount=800_000, tenure_years=25)
    resp = compare_loans(req)
    installments = [p.monthly_installment for p in resp.packages]
    assert installments == sorted(installments)


def test_compare_loans_tdsr_pass_with_income():
    req = LoanComparisonRequest(
        loan_amount=500_000,
        tenure_years=25,
        gross_monthly_income=15_000,
        existing_monthly_commitments=0.0,
    )
    resp = compare_loans(req)
    for p in resp.packages:
        assert p.tdsr_pct is not None
        assert p.tdsr_passes is not None


def test_compare_loans_no_tdsr_without_income():
    req = LoanComparisonRequest(loan_amount=800_000, tenure_years=25)
    resp = compare_loans(req)
    for p in resp.packages:
        assert p.tdsr_pct is None
        assert p.tdsr_passes is None


def test_refinancing_calculates_savings():
    req = RefinancingRequest(
        current_outstanding=500_000,
        current_rate_pct=4.5,
        remaining_years=20,
        penalty_amount=0.0,
        gross_monthly_income=15_000,
    )
    resp = calculate_refinancing(req)
    assert resp.current_monthly_installment > 0
    assert len(resp.options) == 20
    savings = [o for o in resp.options if o.monthly_savings > 0]
    assert len(savings) > 0


def test_refinancing_break_even_none_when_no_penalty():
    req = RefinancingRequest(
        current_outstanding=500_000,
        current_rate_pct=4.5,
        remaining_years=20,
        penalty_amount=0.0,
    )
    resp = calculate_refinancing(req)
    for o in resp.options:
        assert o.break_even_months is None


def test_refinancing_break_even_calculated_with_penalty():
    req = RefinancingRequest(
        current_outstanding=500_000,
        current_rate_pct=4.5,
        remaining_years=20,
        penalty_amount=5_000.0,
    )
    resp = calculate_refinancing(req)
    for o in resp.options:
        if o.monthly_savings > 0:
            assert o.break_even_months is not None
            assert o.break_even_months > 0
