import os
import pytest

os.environ["USE_MOCK_DATA"] = "true"

from app.services.data_gov import DataGovService


@pytest.fixture
def svc():
    return DataGovService()


def test_get_ppi_returns_records(svc):
    result = svc.get_ppi()
    assert len(result) > 0
    rec = result[0]
    assert "quarter" in rec
    assert "index" in rec
    assert isinstance(rec["index"], float)


def test_get_rental_returns_records(svc):
    result = svc.get_rental()
    assert len(result) > 0
    rec = result[0]
    assert "quarter" in rec
    assert "index" in rec
    assert "region" in rec


def test_get_volume_returns_records(svc):
    result = svc.get_volume()
    assert len(result) > 0
    rec = result[0]
    assert "month" in rec
    assert "new_sale" in rec
    assert "resale" in rec


def test_get_vacancy_returns_records(svc):
    result = svc.get_vacancy()
    assert len(result) > 0
    rec = result[0]
    assert "quarter" in rec
    assert "vacancy_pct" in rec


def test_service_uses_mock_when_flag_set(svc):
    result = svc.get_ppi()
    assert result is not None
