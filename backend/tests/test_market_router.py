import os
os.environ["USE_MOCK_DATA"] = "true"

import pytest


def test_get_ppi(client):
    resp = client.get("/api/market/ppi")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "quarter" in data[0]
    assert "index" in data[0]


def test_get_rental(client):
    resp = client.get("/api/market/rental")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "region" in data[0]


def test_get_volume(client):
    resp = client.get("/api/market/volume")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "new_sale" in data[0]
    assert "resale" in data[0]


def test_get_vacancy(client):
    resp = client.get("/api/market/vacancy")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "vacancy_pct" in data[0]
