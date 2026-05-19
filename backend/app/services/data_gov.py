import json
import logging
import os
from pathlib import Path

import requests

_log = logging.getLogger(__name__)
_MOCK_DIR = Path(__file__).parent.parent / "mock_data"

# data.gov.sg v2 API — dataset IDs for private residential property statistics
_DATASETS = {
    "ppi":     "d_ebc5ab87086db484f88045b47411ebc",  # Private Residential Property Price Index
    "rental":  "d_c9f57187485a0d6231933c86fd5f8b0",  # Rental Statistics (Non-landed)
    "volume":  "d_4db69d3a6d20e3af4f6d4e3a9fcfa42a",  # Units sold (primary market)
    "vacancy": "d_f5ca38d41e4de7a0fb31c5b0e18a4720",  # Vacancy of completed private residential
}

_TIMEOUT = 8  # seconds


def _is_mock() -> bool:
    return os.getenv("USE_MOCK_DATA", "true").lower() in ("true", "1", "yes")


def _load_mock(filename: str) -> list[dict]:
    with open(_MOCK_DIR / filename) as f:
        return json.load(f)["records"]


def _fetch_datagov(key: str) -> list[dict]:
    """Fetch dataset from data.gov.sg v2 API and return raw records list."""
    dataset_id = _DATASETS[key]
    # Step 1: initiate poll-download to get the download URL
    poll_url = f"https://api-open.data.gov.sg/v2/public/api/datasets/{dataset_id}/poll-download"
    resp = requests.get(poll_url, timeout=_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    url = data.get("data", {}).get("url")
    if not url:
        raise ValueError(f"No download URL in data.gov.sg response for {key}: {data}")

    # Step 2: download the actual CSV/JSON
    file_resp = requests.get(url, timeout=_TIMEOUT)
    file_resp.raise_for_status()
    return file_resp.json()


class DataGovService:
    def get_ppi(self) -> list[dict]:
        if _is_mock():
            return _load_mock("ppi.json")
        return self._fetch_ppi_live()

    def get_rental(self) -> list[dict]:
        if _is_mock():
            return _load_mock("rental.json")
        return self._fetch_rental_live()

    def get_volume(self) -> list[dict]:
        if _is_mock():
            return _load_mock("volume.json")
        return self._fetch_volume_live()

    def get_vacancy(self) -> list[dict]:
        if _is_mock():
            return _load_mock("vacancy.json")
        return self._fetch_vacancy_live()

    def _fetch_ppi_live(self) -> list[dict]:
        try:
            raw = _fetch_datagov("ppi")
            # Normalise to {quarter, index, change_pct}
            out: list[dict] = []
            prev_idx: float | None = None
            for row in raw:
                q = row.get("quarter") or row.get("Quarter") or row.get("period", "")
                idx = float(row.get("index") or row.get("price_index") or row.get("Index") or 0)
                change = round((idx - prev_idx) / prev_idx * 100, 1) if prev_idx else 0.0
                out.append({"quarter": q, "index": idx, "change_pct": change})
                prev_idx = idx
            return out
        except Exception as exc:
            _log.warning("Live PPI fetch failed (%s) — falling back to mock data", exc)
            return _load_mock("ppi.json")

    def _fetch_rental_live(self) -> list[dict]:
        try:
            raw = _fetch_datagov("rental")
            out: list[dict] = []
            for row in raw:
                out.append({
                    "quarter": row.get("quarter") or row.get("Quarter") or "",
                    "property_type": row.get("property_type") or row.get("type", "Non-landed"),
                    "region": row.get("region") or row.get("Region", ""),
                    "index": float(row.get("index") or row.get("rental_index") or 0),
                })
            return out
        except Exception as exc:
            _log.warning("Live Rental fetch failed (%s) — falling back to mock data", exc)
            return _load_mock("rental.json")

    def _fetch_volume_live(self) -> list[dict]:
        try:
            raw = _fetch_datagov("volume")
            out: list[dict] = []
            for row in raw:
                out.append({
                    "month": row.get("month") or row.get("Month") or "",
                    "new_sale": int(row.get("new_sale") or row.get("New Sale") or 0),
                    "sub_sale": int(row.get("sub_sale") or row.get("Sub Sale") or 0),
                    "resale": int(row.get("resale") or row.get("Resale") or 0),
                })
            return out
        except Exception as exc:
            _log.warning("Live Volume fetch failed (%s) — falling back to mock data", exc)
            return _load_mock("volume.json")

    def _fetch_vacancy_live(self) -> list[dict]:
        try:
            raw = _fetch_datagov("vacancy")
            out: list[dict] = []
            for row in raw:
                out.append({
                    "quarter": row.get("quarter") or row.get("Quarter") or "",
                    "property_type": row.get("property_type") or row.get("type", "Non-landed"),
                    "vacancy_pct": float(row.get("vacancy_pct") or row.get("vacancy_rate") or 0),
                })
            return out
        except Exception as exc:
            _log.warning("Live Vacancy fetch failed (%s) — falling back to mock data", exc)
            return _load_mock("vacancy.json")
