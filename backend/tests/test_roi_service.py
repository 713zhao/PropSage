import pytest
from app.services.roi import calculate_roi, _irr
from app.schemas.roi import ROIRequest


def test_irr_positive_investment():
    cashflows = [-100_000] + [26_380] * 5
    irr = _irr(cashflows)
    assert irr == pytest.approx(10.0, abs=0.5)


def test_irr_negative_returns_negative():
    cashflows = [-100_000, 20_000, 20_000, 20_000, 20_000, 20_000]
    irr = _irr(cashflows)
    assert irr < 0


def test_calculate_roi_basic():
    req = ROIRequest(
        purchase_price=1_000_000,
        loan_amount=750_000,
        annual_rate_pct=3.5,
        tenure_years=25,
        hold_years=5,
        monthly_rental_sgd=3_000,
        annual_appreciation_pct=3.0,
        annual_expenses_pct=1.0,
    )
    resp = calculate_roi(req)
    assert resp.down_payment == pytest.approx(250_000)
    assert len(resp.yearly) == 5
    assert resp.yearly[0].year == 1
    assert resp.yearly[4].year == 5
    assert resp.exit_value > 1_000_000
    assert resp.total_rental_income > 0
    assert len(resp.scenarios) == 3


def test_calculate_roi_scenario_labels():
    req = ROIRequest(
        purchase_price=1_000_000,
        loan_amount=0,
        annual_rate_pct=3.5,
        tenure_years=25,
        hold_years=3,
        monthly_rental_sgd=0,
        annual_appreciation_pct=3.0,
        annual_expenses_pct=0.5,
    )
    resp = calculate_roi(req)
    labels = [s.label for s in resp.scenarios]
    assert "Bear" in labels
    assert "Base" in labels
    assert "Bull" in labels


def test_calculate_roi_bull_beats_bear():
    req = ROIRequest(
        purchase_price=1_000_000,
        loan_amount=750_000,
        annual_rate_pct=3.5,
        tenure_years=25,
        hold_years=5,
        monthly_rental_sgd=3_000,
        annual_appreciation_pct=3.0,
        annual_expenses_pct=1.0,
    )
    resp = calculate_roi(req)
    bear = next(s for s in resp.scenarios if s.label == "Bear")
    bull = next(s for s in resp.scenarios if s.label == "Bull")
    assert bull.net_gain > bear.net_gain
    assert bull.irr_pct > bear.irr_pct


def test_calculate_roi_cumulative_cashflow_increases_with_rental():
    req = ROIRequest(
        purchase_price=1_000_000,
        loan_amount=0,
        annual_rate_pct=3.5,
        tenure_years=25,
        hold_years=5,
        monthly_rental_sgd=4_000,
        annual_appreciation_pct=0.0,
        annual_expenses_pct=0.0,
    )
    resp = calculate_roi(req)
    for i in range(1, len(resp.yearly)):
        assert resp.yearly[i].cumulative_cashflow > resp.yearly[i - 1].cumulative_cashflow
