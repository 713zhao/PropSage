import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.map_service import get_districts, get_amenities

client = TestClient(app)


def test_get_districts_returns_28():
    districts = get_districts(db=None)
    assert len(districts) == 28
    for d in districts:
        assert "code" in d
        assert "name" in d
        assert "psf_median" in d
        assert "lat" in d
        assert "lng" in d
        assert d["psf_median"] > 0


def test_get_amenities_mrt():
    amenities = get_amenities("mrt")
    assert len(amenities) >= 15
    for a in amenities:
        assert "name" in a
        assert "lat" in a
        assert "lng" in a
        assert "type" in a


def test_get_amenities_school():
    amenities = get_amenities("school")
    assert len(amenities) >= 10


def test_get_amenities_mall():
    amenities = get_amenities("mall")
    assert len(amenities) >= 10


def test_get_amenities_invalid_type():
    amenities = get_amenities("unknown")
    assert amenities == []


def test_map_districts_api_200():
    resp = client.get("/api/map/districts")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 28
    first = data[0]
    assert "code" in first
    assert "psf_median" in first
    assert "lat" in first


def test_map_amenities_api_200():
    resp = client.get("/api/map/amenities/mrt")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 15


def test_map_amenities_api_invalid():
    resp = client.get("/api/map/amenities/unknown")
    assert resp.status_code == 200
    assert resp.json() == []
