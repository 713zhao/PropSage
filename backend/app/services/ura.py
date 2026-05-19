import json
import logging
import os
from datetime import date
from pathlib import Path

import requests

_log = logging.getLogger(__name__)
_MOCK_DIR = Path(__file__).parent.parent / "mock_data"
_URA_BASE = "https://eservices.ura.gov.sg/uraDataService"
_SQM_TO_SQFT = 10.7639
_TIMEOUT = 15


def _is_mock() -> bool:
    return os.getenv("USE_MOCK_DATA", "true").lower() in ("true", "1", "yes")


def _load_mock() -> list[dict]:
    with open(_MOCK_DIR / "transactions.json") as f:
        return json.load(f)["records"]


def _recent_quarters(n: int) -> list[str]:
    """Return the last n completed quarters in URA refPeriod format e.g. '25q4'."""
    today = date.today()
    year, month = today.year, today.month
    # Current quarter index (1-based)
    current_q = (month - 1) // 3 + 1
    quarters = []
    q, y = current_q - 1, year
    if q < 1:
        q = 4
        y -= 1
    for _ in range(n):
        quarters.append(f"{y % 100:02d}q{q}")
        q -= 1
        if q < 1:
            q = 4
            y -= 1
    return quarters


def _get_ura_token(access_key: str) -> str:
    resp = requests.get(
        f"{_URA_BASE}/insertNewToken.action",
        params={"accessKey": access_key},
        headers={"User-Agent": "PropSage/2.0"},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("Result") != "Success":
        raise ValueError(f"URA token error: {data}")
    return data["token"]


def _contract_date_to_str(raw: str) -> str:
    """Convert URA contractDate '2410' → '2024-10'."""
    if len(raw) == 4:
        return f"20{raw[:2]}-{raw[2:]}"
    return raw


def _tenure_from_lease(lease_date: str) -> str:
    if lease_date == "9999" or not lease_date:
        return "Freehold"
    return "99-year Leasehold"


def _normalize_ura(proj: dict, tx: dict) -> dict:
    area_sqm = float(tx.get("area", 0) or 0)
    area_sqft = round(area_sqm * _SQM_TO_SQFT, 1)
    price = float(tx.get("price", 0) or 0)
    psf = round(price / area_sqft, 0) if area_sqft > 0 else 0.0
    return {
        "project": proj.get("project", ""),
        "street": proj.get("street", ""),
        "district": tx.get("district", ""),
        "area_sqft": area_sqft,
        "price": price,
        "psf": psf,
        "floor_range": tx.get("floorRange", ""),
        "tenure": _tenure_from_lease(tx.get("leaseDate", "9999")),
        "sale_date": _contract_date_to_str(tx.get("contractDate", "")),
        "property_type": tx.get("propertyType", ""),
    }


def _fetch_ura_live() -> list[dict]:
    access_key = os.getenv("URA_ACCESS_KEY", "")
    if not access_key:
        _log.warning("URA_ACCESS_KEY not set — falling back to mock data")
        return _load_mock()

    token = _get_ura_token(access_key)
    records: list[dict] = []

    for ref_period in _recent_quarters(2):
        for batch in (1, 2, 3, 4):
            try:
                resp = requests.get(
                    f"{_URA_BASE}/invokeUraDS",
                    params={
                        "service": "PMI_Resi_Transaction",
                        "refPeriod": ref_period,
                        "batch": batch,
                        "token": token,
                    },
                    headers={"User-Agent": "PropSage/2.0"},
                    timeout=_TIMEOUT,
                )
                resp.raise_for_status()
                data = resp.json()
                if data.get("Status") != "Success" or not data.get("Result"):
                    break
                for proj in data["Result"]:
                    for tx in proj.get("transaction", []):
                        records.append(_normalize_ura(proj, tx))
            except Exception as exc:
                _log.debug("URA batch %s/%s failed: %s", ref_period, batch, exc)
                break

    return records if records else _load_mock()


class URAService:
    def search(
        self,
        district: str | None = None,
        property_type: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        min_psf: float | None = None,
        max_psf: float | None = None,
        limit: int = 50,
    ) -> list[dict]:
        try:
            records = _load_mock() if _is_mock() else _fetch_ura_live()
        except Exception as exc:
            _log.warning("URA fetch failed (%s) — falling back to mock data", exc)
            records = _load_mock()

        if district is not None:
            records = [r for r in records if r["district"] == district]
        if property_type is not None:
            records = [r for r in records if r["property_type"] == property_type]
        if min_price is not None:
            records = [r for r in records if r["price"] >= min_price]
        if max_price is not None:
            records = [r for r in records if r["price"] <= max_price]
        if min_psf is not None:
            records = [r for r in records if r["psf"] >= min_psf]
        if max_psf is not None:
            records = [r for r in records if r["psf"] <= max_psf]
        return records[:limit]

    def get_comps(
        self,
        district: str,
        area_sqft: float,
        tolerance_pct: float = 0.2,
    ) -> list[dict]:
        try:
            records = _load_mock() if _is_mock() else _fetch_ura_live()
        except Exception as exc:
            _log.warning("URA fetch failed (%s) — falling back to mock data", exc)
            records = _load_mock()

        lower = area_sqft * (1 - tolerance_pct)
        upper = area_sqft * (1 + tolerance_pct)
        comps = [
            r for r in records
            if r["district"] == district and lower <= r["area_sqft"] <= upper
        ]
        if not comps:
            comps = [r for r in records if r["district"] == district]
        return comps
