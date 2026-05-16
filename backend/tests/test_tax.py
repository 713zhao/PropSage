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

    def test_unknown_citizenship_falls_back_to_entity_rate(self):
        assert calculate_absd(1_000_000, "Unknown", 0) == 650_000.0


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
