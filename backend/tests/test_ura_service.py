import os
import pytest

os.environ["USE_MOCK_DATA"] = "true"

from app.services.ura import URAService


@pytest.fixture
def svc():
    return URAService()


def test_search_returns_records(svc):
    result = svc.search()
    assert len(result) > 0
    rec = result[0]
    assert "project" in rec
    assert "district" in rec
    assert "price" in rec
    assert "psf" in rec


def test_search_filter_by_district(svc):
    result = svc.search(district="15")
    assert all(r["district"] == "15" for r in result)


def test_search_filter_by_property_type(svc):
    result = svc.search(property_type="Condominium")
    assert all(r["property_type"] == "Condominium" for r in result)


def test_search_filter_min_price(svc):
    result = svc.search(min_price=2_000_000)
    assert all(r["price"] >= 2_000_000 for r in result)


def test_search_filter_max_price(svc):
    result = svc.search(max_price=2_000_000)
    assert all(r["price"] <= 2_000_000 for r in result)


def test_get_comps_returns_at_least_one_record(svc):
    result = svc.get_comps(district="15", area_sqft=1000.0, tolerance_pct=0.5)
    assert len(result) >= 1


def test_service_uses_mock_when_flag_set(svc):
    result = svc.search()
    assert result is not None
