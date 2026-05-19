import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.enbloc import score_development, get_all_developments

client = TestClient(app)


def test_score_development_range():
    dev = {"age_years": 40, "plot_ratio_headroom": 80.0, "land_area_sqft": 300_000, "district": "D09", "previous_csc_attempt": True, "ownership_units": 200, "lease_remaining_years": 60}
    score = score_development(dev)
    assert 0 <= score <= 100


def test_score_development_higher_age_better():
    base = {"age_years": 20, "plot_ratio_headroom": 50.0, "land_area_sqft": 200_000, "district": "D15", "previous_csc_attempt": False, "ownership_units": 300, "lease_remaining_years": 70}
    older = {**base, "age_years": 50}
    assert score_development(older) > score_development(base)


def test_score_development_csc_boosts_score():
    base = {"age_years": 35, "plot_ratio_headroom": 60.0, "land_area_sqft": 200_000, "district": "D19", "previous_csc_attempt": False, "ownership_units": 250, "lease_remaining_years": 65}
    with_csc = {**base, "previous_csc_attempt": True}
    assert score_development(with_csc) > score_development(base)


def test_get_all_developments_returns_list():
    devs = get_all_developments()
    assert len(devs) >= 10
    for d in devs:
        assert "name" in d
        assert "score" in d
        assert 0 <= d["score"] <= 100
        assert "csc_status" in d


def test_enbloc_api_200():
    resp = client.get("/api/enbloc/developments")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    first = data[0]
    assert "name" in first
    assert "score" in first
    assert "district" in first
    assert "csc_status" in first
