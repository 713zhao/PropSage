import json
import os
from pathlib import Path

_MOCK_DIR = Path(__file__).parent.parent / "mock_data"
_USE_MOCK = os.getenv("USE_MOCK_DATA", "true").lower() in ("true", "1", "yes")


def _load_mock() -> list[dict]:
    with open(_MOCK_DIR / "transactions.json") as f:
        return json.load(f)["records"]


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
        records = _load_mock() if _USE_MOCK else self._fetch_live()
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
        records = _load_mock() if _USE_MOCK else self._fetch_live()
        lower = area_sqft * (1 - tolerance_pct)
        upper = area_sqft * (1 + tolerance_pct)
        comps = [
            r for r in records
            if r["district"] == district and lower <= r["area_sqft"] <= upper
        ]
        if not comps:
            # Widen to all records in district if none match area filter
            comps = [r for r in records if r["district"] == district]
        return comps

    def _fetch_live(self) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("Live URA fetch not yet implemented")
