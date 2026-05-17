import os
os.environ["USE_MOCK_DATA"] = "true"

import pytest


def test_search_all(client):
    resp = client.post("/api/transactions/search", json={})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    rec = data[0]
    assert "project" in rec
    assert "psf" in rec
    assert "price" in rec


def test_search_filter_district(client):
    resp = client.post("/api/transactions/search", json={"district": "15"})
    assert resp.status_code == 200
    data = resp.json()
    assert all(r["district"] == "15" for r in data)


def test_search_filter_property_type(client):
    resp = client.post("/api/transactions/search", json={"property_type": "Condominium"})
    assert resp.status_code == 200
    data = resp.json()
    assert all(r["property_type"] == "Condominium" for r in data)


def test_search_filter_price_range(client):
    resp = client.post("/api/transactions/search", json={"min_price": 2000000, "max_price": 3000000})
    assert resp.status_code == 200
    data = resp.json()
    assert all(2_000_000 <= r["price"] <= 3_000_000 for r in data)


def test_get_comps(client):
    resp = client.post("/api/transactions/comps", json={
        "district": "15",
        "area_sqft": 1000.0,
        "tolerance_pct": 0.5
    })
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "psf" in data[0]
