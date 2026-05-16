import pytest
from app.services.tax import (
    calculate_bsd,
    calculate_absd,
    calculate_ssd,
    calculate_upfront_cost,
)


class TestCalculateBsd:
    def test_first_bracket_only(self):
        # $100K → 1% of 100K = 1,000
        assert calculate_bsd(100_000) == 1_000.0

    def test_two_brackets(self):
        # 1% × 180K = 1,800 + 2% × 100K = 2,000 → 3,800
        assert calculate_bsd(280_000) == 3_800.0

    def test_three_brackets_at_1m(self):
        # 1% × 180K = 1,800 + 2% × 180K = 3,600 + 3% × 640K = 19,200 → 24,600
        assert calculate_bsd(1_000_000) == 24_600.0

    def test_fourth_bracket(self):
        # 24,600 + 4% × 500K = 20,000 → 44,600
        assert calculate_bsd(1_500_000) == 44_600.0

    def test_zero_price(self):
        assert calculate_bsd(0) == 0.0

    def test_exactly_first_bracket_threshold(self):
        # 1% × 180K = 1,800
        assert calculate_bsd(180_000) == 1_800.0

    def test_end_of_second_bracket(self):
        # 1% × 180K = 1,800 + 2% × 180K = 3,600 → 5,400
        assert calculate_bsd(360_000) == 5_400.0


class TestCalculateAbsd:
    def test_sc_first_property_zero(self):
        assert calculate_absd(1_000_000, "SC", 0) == 0.0

    def test_sc_second_property_20pct(self):
        assert calculate_absd(1_000_000, "SC", 1) == 200_000.0

    def test_sc_third_property_30pct(self):
        assert calculate_absd(1_000_000, "SC", 2) == 300_000.0

    def test_pr_first_property_5pct(self):
        assert calculate_absd(1_000_000, "PR", 0) == 50_000.0

    def test_pr_second_property_30pct(self):
        assert calculate_absd(1_000_000, "PR", 1) == 300_000.0

    def test_foreigner_always_60pct(self):
        assert calculate_absd(1_000_000, "Foreigner", 0) == 600_000.0
        assert calculate_absd(1_000_000, "Foreigner", 1) == 600_000.0

    def test_entity_always_65pct(self):
        assert calculate_absd(1_000_000, "Entity", 0) == 650_000.0

    def test_sc_fourth_plus_property_capped_at_30pct(self):
        # existing_property_count=3 → purchase_number capped at 3 → SC rate is 30%
        assert calculate_absd(1_000_000, "SC", 3) == 300_000.0

    def test_unknown_citizenship_raises_value_error(self):
        with pytest.raises(ValueError, match="Unknown citizenship"):
            calculate_absd(1_000_000, "Unknown", 0)

    def test_lowercase_sc_raises_value_error(self):
        with pytest.raises(ValueError, match="Unknown citizenship"):
            calculate_absd(1_000_000, "sc", 0)


class TestCalculateSsd:
    def test_within_one_year_12pct(self):
        assert calculate_ssd(1_000_000, 0.5) == 120_000.0

    def test_one_to_two_years_8pct(self):
        assert calculate_ssd(1_000_000, 1.5) == 80_000.0

    def test_two_to_three_years_4pct(self):
        assert calculate_ssd(1_000_000, 2.5) == 40_000.0

    def test_exactly_three_years_4pct(self):
        assert calculate_ssd(1_000_000, 3.0) == 40_000.0

    def test_beyond_three_years_zero(self):
        assert calculate_ssd(1_000_000, 5.0) == 0.0

    def test_exactly_one_year_12pct(self):
        assert calculate_ssd(1_000_000, 1.0) == 120_000.0

    def test_exactly_two_years_8pct(self):
        assert calculate_ssd(1_000_000, 2.0) == 80_000.0

    def test_zero_hold_years_12pct(self):
        assert calculate_ssd(1_000_000, 0) == 120_000.0


class TestCalculateUpfrontCost:
    def test_sc_first_property_full_breakdown(self):
        result = calculate_upfront_cost(1_000_000, "SC", 0)
        assert result["purchase_price"] == 1_000_000
        assert result["bsd"] == 24_600.0
        assert result["absd"] == 0.0
        assert result["legal_fees"] == 3_000.0
        assert result["agent_commission"] == 10_000.0  # 1% of 1M
        assert result["valuation_fee"] == 500.0
        assert result["renovation_budget"] == 0.0
        assert result["total_cash_outlay"] == 1_038_100.0

    def test_renovation_budget_included_in_total(self):
        result = calculate_upfront_cost(1_000_000, "SC", 0, renovation_budget=50_000)
        assert result["renovation_budget"] == 50_000.0
        assert result["total_cash_outlay"] == 1_088_100.0

    def test_foreigner_high_absd_in_total(self):
        result = calculate_upfront_cost(1_000_000, "Foreigner", 0)
        assert result["absd"] == 600_000.0
        assert result["total_cash_outlay"] > 1_600_000

    def test_custom_agent_rate(self):
        # 0.5% of $1M = $5,000 commission
        result = calculate_upfront_cost(1_000_000, "SC", 0, agent_rate=0.005)
        assert result["agent_commission"] == 5_000.0


class TestInputValidation:
    def test_negative_price_bsd_raises(self):
        with pytest.raises(ValueError, match="price must be non-negative"):
            calculate_bsd(-1)

    def test_negative_price_absd_raises(self):
        with pytest.raises(ValueError, match="price must be non-negative"):
            calculate_absd(-1, "SC", 0)

    def test_negative_price_ssd_raises(self):
        with pytest.raises(ValueError, match="price must be non-negative"):
            calculate_ssd(-1, 1.0)

    def test_negative_hold_years_raises(self):
        with pytest.raises(ValueError, match="hold_years must be non-negative"):
            calculate_ssd(1_000_000, -0.5)

    def test_negative_existing_property_count_raises(self):
        with pytest.raises(ValueError, match="existing_property_count must be non-negative"):
            calculate_absd(1_000_000, "SC", -1)

    def test_negative_price_upfront_cost_raises(self):
        with pytest.raises(ValueError, match="price must be non-negative"):
            calculate_upfront_cost(-1, "SC", 0)

    def test_negative_renovation_budget_raises(self):
        with pytest.raises(ValueError, match="renovation_budget must be non-negative"):
            calculate_upfront_cost(1_000_000, "SC", 0, renovation_budget=-100)
