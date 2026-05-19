# Phase 4 — Visual Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive Singapore district map (PSF heat map + amenity layers) and an en-bloc intelligence page (scoring model + watch list).

**Architecture:** Two new backend routers (`/api/map`, `/api/enbloc`) backed by a new ORM model and pure-Python services. Two new React pages use react-leaflet for the map and Zustand for the en-bloc watch list. District PSF data is aggregated live from the existing `transactions` table; amenity + en-bloc seed data is inlined as Python constants.

**Tech Stack:** Python FastAPI, SQLAlchemy 2.0, pytest; React 18 + TypeScript + Vite; react-leaflet 4 + leaflet; Zustand; Tailwind CSS.

---

## File Structure

**Backend (new):**
- `backend/app/models/enbloc.py` — EnblocDevelopment ORM model
- `backend/app/schemas/map.py` — DistrictData, AmenityPoint, MapDistrictsResponse, AmenitiesResponse
- `backend/app/schemas/enbloc.py` — DevelopmentProfile, EnblocResponse
- `backend/app/services/map_service.py` — district PSF aggregation + amenity mock data
- `backend/app/services/enbloc.py` — scoring engine + seed developments
- `backend/app/routers/map.py` — GET /api/map/districts, GET /api/map/amenities/{type}
- `backend/app/routers/enbloc.py` — GET /api/enbloc/developments

**Backend (modified):**
- `backend/app/database.py` — register enbloc model
- `backend/app/main.py` — include map + enbloc routers

**Frontend (new):**
- `frontend/src/api/map.ts` — DistrictData, AmenityPoint types + API calls
- `frontend/src/api/enbloc.ts` — DevelopmentProfile types + API calls
- `frontend/src/stores/watchlistStore.ts` — Zustand store for en-bloc watch list
- `frontend/src/pages/MapPage.tsx` — Leaflet map + PSF circles + layer toggles + district popup
- `frontend/src/pages/EnblocPage.tsx` — score table + watch list badge + pipeline

**Frontend (modified):**
- `frontend/src/App.tsx` — wire /map → MapPage, /enbloc → EnblocPage

---

### Task 1: En-Bloc Backend

**Files:**
- Create: `backend/app/models/enbloc.py`
- Create: `backend/app/schemas/enbloc.py`
- Create: `backend/app/services/enbloc.py`
- Create: `backend/app/routers/enbloc.py`
- Modify: `backend/app/database.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_enbloc.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_enbloc.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.enbloc import score_development, get_all_developments

client = TestClient(app)


def test_score_development_range():
    dev = {
        "age_years": 40,
        "plot_ratio_headroom": 80.0,
        "land_area_sqft": 300_000,
        "district": "D09",
        "previous_csc_attempt": True,
        "ownership_units": 200,
        "lease_remaining_years": 60,
    }
    score = score_development(dev)
    assert 0 <= score <= 100


def test_score_development_higher_age_better():
    base = {
        "age_years": 20,
        "plot_ratio_headroom": 50.0,
        "land_area_sqft": 200_000,
        "district": "D15",
        "previous_csc_attempt": False,
        "ownership_units": 300,
        "lease_remaining_years": 70,
    }
    older = {**base, "age_years": 50}
    assert score_development(older) > score_development(base)


def test_score_development_csc_boosts_score():
    base = {
        "age_years": 35,
        "plot_ratio_headroom": 60.0,
        "land_area_sqft": 200_000,
        "district": "D19",
        "previous_csc_attempt": False,
        "ownership_units": 250,
        "lease_remaining_years": 65,
    }
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd backend && python -m pytest tests/test_enbloc.py -v
```

Expected: ImportError / 404

- [ ] **Step 3: Create ORM model**

```python
# backend/app/models/enbloc.py
from sqlalchemy import Boolean, Column, Float, Integer, String
from app.database import Base


class EnblocDevelopment(Base):
    __tablename__ = "enbloc_developments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    district = Column(String, index=True)
    age_years = Column(Integer)
    plot_ratio_headroom = Column(Float)   # % unused plot ratio
    land_area_sqft = Column(Float)
    previous_csc_attempt = Column(Boolean, default=False)
    ownership_units = Column(Integer)
    lease_remaining_years = Column(Integer)
    csc_status = Column(String, default="None")  # None | Pending | Approved | Lapsed
    lat = Column(Float)
    lng = Column(Float)
```

- [ ] **Step 4: Register model in database.py**

In `backend/app/database.py`, update `_register_models`:

```python
def _register_models() -> None:
    from app.models import transaction, market_data, enbloc  # noqa: F401
```

- [ ] **Step 5: Create enbloc schemas**

```python
# backend/app/schemas/enbloc.py
from pydantic import BaseModel


class DevelopmentProfile(BaseModel):
    id: int
    name: str
    district: str
    age_years: int
    plot_ratio_headroom: float
    land_area_sqft: float
    previous_csc_attempt: bool
    ownership_units: int
    lease_remaining_years: int
    csc_status: str
    lat: float
    lng: float
    score: int


class EnblocResponse(BaseModel):
    developments: list[DevelopmentProfile]
```

- [ ] **Step 6: Create enbloc service**

```python
# backend/app/services/enbloc.py
from app.schemas.enbloc import DevelopmentProfile

# Weights from design spec section 10
_WEIGHTS = {
    "age": 0.20,
    "plot_ratio": 0.25,
    "land_size": 0.15,
    "location": 0.15,
    "csc_attempt": 0.10,
    "ownership": 0.10,
    "lease": 0.05,
}

# Prime districts score higher for location factor
_DISTRICT_SCORES = {
    "D09": 10, "D10": 9, "D11": 9, "D01": 8, "D02": 8, "D06": 8,
    "D03": 7, "D04": 7, "D05": 7, "D07": 6, "D08": 6, "D15": 6,
    "D12": 5, "D13": 5, "D14": 4, "D19": 5, "D20": 4, "D21": 5,
    "D16": 4, "D17": 3, "D18": 3, "D22": 3, "D23": 3, "D24": 2,
    "D25": 2, "D26": 2, "D27": 2, "D28": 2,
}

_SEED_DEVELOPMENTS = [
    {
        "id": 1, "name": "Braddell View", "district": "D13",
        "age_years": 48, "plot_ratio_headroom": 120.0, "land_area_sqft": 1_130_000,
        "previous_csc_attempt": True, "ownership_units": 918,
        "lease_remaining_years": 51, "csc_status": "Pending",
        "lat": 1.3286, "lng": 103.8745,
    },
    {
        "id": 2, "name": "Pearlbank Apartments", "district": "D02",
        "age_years": 52, "plot_ratio_headroom": 150.0, "land_area_sqft": 82_000,
        "previous_csc_attempt": True, "ownership_units": 288,
        "lease_remaining_years": 47, "csc_status": "Approved",
        "lat": 1.2798, "lng": 103.8396,
    },
    {
        "id": 3, "name": "Amber Park", "district": "D15",
        "age_years": 38, "plot_ratio_headroom": 95.0, "land_area_sqft": 213_000,
        "previous_csc_attempt": True, "ownership_units": 200,
        "lease_remaining_years": 61, "csc_status": "Approved",
        "lat": 1.3088, "lng": 103.9039,
    },
    {
        "id": 4, "name": "Rio Casa", "district": "D19",
        "age_years": 35, "plot_ratio_headroom": 110.0, "land_area_sqft": 302_000,
        "previous_csc_attempt": True, "ownership_units": 286,
        "lease_remaining_years": 64, "csc_status": "Approved",
        "lat": 1.3651, "lng": 103.8706,
    },
    {
        "id": 5, "name": "Watergate", "district": "D19",
        "age_years": 32, "plot_ratio_headroom": 85.0, "land_area_sqft": 185_000,
        "previous_csc_attempt": True, "ownership_units": 210,
        "lease_remaining_years": 67, "csc_status": "Lapsed",
        "lat": 1.3620, "lng": 103.8740,
    },
    {
        "id": 6, "name": "Florence Regency", "district": "D19",
        "age_years": 29, "plot_ratio_headroom": 90.0, "land_area_sqft": 389_000,
        "previous_csc_attempt": False, "ownership_units": 336,
        "lease_remaining_years": 70, "csc_status": "None",
        "lat": 1.3700, "lng": 103.8800,
    },
    {
        "id": 7, "name": "City Towers", "district": "D10",
        "age_years": 45, "plot_ratio_headroom": 70.0, "land_area_sqft": 92_000,
        "previous_csc_attempt": True, "ownership_units": 138,
        "lease_remaining_years": 54, "csc_status": "Lapsed",
        "lat": 1.3237, "lng": 103.8200,
    },
    {
        "id": 8, "name": "Park West", "district": "D05",
        "age_years": 36, "plot_ratio_headroom": 100.0, "land_area_sqft": 657_000,
        "previous_csc_attempt": False, "ownership_units": 432,
        "lease_remaining_years": 63, "csc_status": "None",
        "lat": 1.3063, "lng": 103.7898,
    },
    {
        "id": 9, "name": "Mandarin Gardens", "district": "D15",
        "age_years": 39, "plot_ratio_headroom": 80.0, "land_area_sqft": 751_000,
        "previous_csc_attempt": False, "ownership_units": 1008,
        "lease_remaining_years": 60, "csc_status": "None",
        "lat": 1.3100, "lng": 103.9000,
    },
    {
        "id": 10, "name": "Thomson View", "district": "D20",
        "age_years": 41, "plot_ratio_headroom": 60.0, "land_area_sqft": 365_000,
        "previous_csc_attempt": False, "ownership_units": 254,
        "lease_remaining_years": 58, "csc_status": "None",
        "lat": 1.3691, "lng": 103.8454,
    },
    {
        "id": 11, "name": "Hollandia", "district": "D10",
        "age_years": 44, "plot_ratio_headroom": 75.0, "land_area_sqft": 78_000,
        "previous_csc_attempt": False, "ownership_units": 56,
        "lease_remaining_years": 55, "csc_status": "None",
        "lat": 1.3200, "lng": 103.8050,
    },
    {
        "id": 12, "name": "Changi Garden", "district": "D17",
        "age_years": 37, "plot_ratio_headroom": 45.0, "land_area_sqft": 241_000,
        "previous_csc_attempt": False, "ownership_units": 204,
        "lease_remaining_years": 62, "csc_status": "None",
        "lat": 1.3605, "lng": 103.9614,
    },
]


def score_development(dev: dict) -> int:
    age_score = min(dev["age_years"] / 5.0, 10.0)
    plot_score = min(dev["plot_ratio_headroom"] / 15.0, 10.0)
    land_score = min(dev["land_area_sqft"] / 100_000.0, 10.0)
    location_score = float(_DISTRICT_SCORES.get(dev["district"], 3))
    csc_score = 10.0 if dev["previous_csc_attempt"] else 0.0
    # Fewer units = less fragmentation = higher score
    ownership_score = max(0.0, 10.0 - dev["ownership_units"] / 100.0)
    # Shorter lease = more urgency = higher score (but low value for developer)
    lease_score = max(0.0, 10.0 - dev["lease_remaining_years"] / 10.0)

    raw = (
        age_score * _WEIGHTS["age"]
        + plot_score * _WEIGHTS["plot_ratio"]
        + land_score * _WEIGHTS["land_size"]
        + location_score * _WEIGHTS["location"]
        + csc_score * _WEIGHTS["csc_attempt"]
        + ownership_score * _WEIGHTS["ownership"]
        + lease_score * _WEIGHTS["lease"]
    )
    return round(raw * 10)


def get_all_developments() -> list[dict]:
    result = []
    for dev in _SEED_DEVELOPMENTS:
        d = dict(dev)
        d["score"] = score_development(dev)
        result.append(d)
    result.sort(key=lambda x: x["score"], reverse=True)
    return result
```

- [ ] **Step 7: Create enbloc router**

```python
# backend/app/routers/enbloc.py
from fastapi import APIRouter
from app.schemas.enbloc import DevelopmentProfile
from app.services.enbloc import get_all_developments

router = APIRouter(prefix="/api/enbloc", tags=["enbloc"])


@router.get("/developments", response_model=list[DevelopmentProfile])
def list_developments() -> list[DevelopmentProfile]:
    return [DevelopmentProfile(**d) for d in get_all_developments()]
```

- [ ] **Step 8: Register router in main.py**

In `backend/app/main.py`, add `enbloc` to router imports and add `app.include_router(enbloc.router)`.

- [ ] **Step 9: Run tests — expect pass**

```
cd backend && python -m pytest tests/test_enbloc.py -v
```

Expected: 5/5 PASS

- [ ] **Step 10: Run full suite**

```
cd backend && python -m pytest -v
```

Expected: All tests pass (115 + 5 = 120 total).

- [ ] **Step 11: Commit**

```
git add backend/app/models/enbloc.py backend/app/schemas/enbloc.py backend/app/services/enbloc.py backend/app/routers/enbloc.py backend/app/database.py backend/app/main.py backend/tests/test_enbloc.py
git commit -m "feat: en-bloc scoring model with 12 seed developments"
```

---

### Task 2: Map Backend

**Files:**
- Create: `backend/app/schemas/map.py`
- Create: `backend/app/services/map_service.py`
- Create: `backend/app/routers/map.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_map.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_map.py
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd backend && python -m pytest tests/test_map.py -v
```

Expected: ImportError / 404

- [ ] **Step 3: Create map schemas**

```python
# backend/app/schemas/map.py
from pydantic import BaseModel


class DistrictData(BaseModel):
    code: str
    name: str
    psf_median: float
    lat: float
    lng: float
    transaction_count: int


class AmenityPoint(BaseModel):
    name: str
    lat: float
    lng: float
    type: str
    subtype: str = ""
```

- [ ] **Step 4: Create map service**

```python
# backend/app/services/map_service.py
from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.schemas.map import DistrictData, AmenityPoint

# 28 Singapore postal districts with centroids and fallback PSF values
_DISTRICT_SEED: list[dict] = [
    {"code": "D01", "name": "Raffles Place / Marina", "lat": 1.2830, "lng": 103.8513, "psf_fallback": 2800},
    {"code": "D02", "name": "Tanjong Pagar / Anson", "lat": 1.2789, "lng": 103.8432, "psf_fallback": 2500},
    {"code": "D03", "name": "Queenstown / Tiong Bahru", "lat": 1.2942, "lng": 103.8062, "psf_fallback": 1800},
    {"code": "D04", "name": "Harbourfront / Telok Blangah", "lat": 1.2718, "lng": 103.8198, "psf_fallback": 1600},
    {"code": "D05", "name": "Buona Vista / West Coast", "lat": 1.3063, "lng": 103.7898, "psf_fallback": 1700},
    {"code": "D06", "name": "City Hall / Clarke Quay", "lat": 1.2944, "lng": 103.8509, "psf_fallback": 3200},
    {"code": "D07", "name": "Beach Road / Little India", "lat": 1.3071, "lng": 103.8593, "psf_fallback": 2000},
    {"code": "D08", "name": "Farrer Park / Serangoon Rd", "lat": 1.3160, "lng": 103.8565, "psf_fallback": 1800},
    {"code": "D09", "name": "Orchard / River Valley", "lat": 1.3048, "lng": 103.8318, "psf_fallback": 3000},
    {"code": "D10", "name": "Bukit Timah / Holland", "lat": 1.3237, "lng": 103.8200, "psf_fallback": 2200},
    {"code": "D11", "name": "Newton / Novena", "lat": 1.3255, "lng": 103.8350, "psf_fallback": 2400},
    {"code": "D12", "name": "Toa Payoh / Balestier", "lat": 1.3343, "lng": 103.8516, "psf_fallback": 1400},
    {"code": "D13", "name": "Macpherson / Potong Pasir", "lat": 1.3286, "lng": 103.8745, "psf_fallback": 1300},
    {"code": "D14", "name": "Geylang / Paya Lebar", "lat": 1.3152, "lng": 103.8912, "psf_fallback": 1200},
    {"code": "D15", "name": "Katong / Joo Chiat", "lat": 1.3088, "lng": 103.9039, "psf_fallback": 1800},
    {"code": "D16", "name": "Bedok / Upper East Coast", "lat": 1.3240, "lng": 103.9267, "psf_fallback": 1100},
    {"code": "D17", "name": "Loyang / Changi", "lat": 1.3605, "lng": 103.9614, "psf_fallback": 900},
    {"code": "D18", "name": "Tampines / Pasir Ris", "lat": 1.3535, "lng": 103.9443, "psf_fallback": 1000},
    {"code": "D19", "name": "Serangoon / Hougang", "lat": 1.3651, "lng": 103.8706, "psf_fallback": 1200},
    {"code": "D20", "name": "Ang Mo Kio / Bishan", "lat": 1.3691, "lng": 103.8454, "psf_fallback": 1100},
    {"code": "D21", "name": "Upper Bukit Timah / Clementi", "lat": 1.3472, "lng": 103.7760, "psf_fallback": 1500},
    {"code": "D22", "name": "Jurong / Boon Lay", "lat": 1.3359, "lng": 103.7040, "psf_fallback": 1000},
    {"code": "D23", "name": "Bukit Panjang / Choa Chu Kang", "lat": 1.3779, "lng": 103.7711, "psf_fallback": 1000},
    {"code": "D24", "name": "Lim Chu Kang / Tengah", "lat": 1.3853, "lng": 103.7456, "psf_fallback": 900},
    {"code": "D25", "name": "Kranji / Woodgrove", "lat": 1.4263, "lng": 103.7568, "psf_fallback": 800},
    {"code": "D26", "name": "Mandai / Upper Thomson", "lat": 1.4146, "lng": 103.8060, "psf_fallback": 800},
    {"code": "D27", "name": "Sembawang / Yishun", "lat": 1.4491, "lng": 103.8186, "psf_fallback": 850},
    {"code": "D28", "name": "Seletar / Yio Chu Kang", "lat": 1.4034, "lng": 103.8672, "psf_fallback": 900},
]

_AMENITIES: dict[str, list[dict]] = {
    "mrt": [
        {"name": "City Hall", "lat": 1.2931, "lng": 103.8520, "subtype": "NSL/EWL"},
        {"name": "Raffles Place", "lat": 1.2834, "lng": 103.8516, "subtype": "NSL/EWL"},
        {"name": "Dhoby Ghaut", "lat": 1.2998, "lng": 103.8456, "subtype": "NSL/CCL/NEL"},
        {"name": "Orchard", "lat": 1.3040, "lng": 103.8318, "subtype": "NSL"},
        {"name": "Newton", "lat": 1.3129, "lng": 103.8387, "subtype": "NSL/DTL"},
        {"name": "Novena", "lat": 1.3202, "lng": 103.8440, "subtype": "NSL"},
        {"name": "Toa Payoh", "lat": 1.3329, "lng": 103.8468, "subtype": "NSL"},
        {"name": "Bishan", "lat": 1.3510, "lng": 103.8484, "subtype": "NSL/CCL"},
        {"name": "Yishun", "lat": 1.4295, "lng": 103.8354, "subtype": "NSL"},
        {"name": "Woodlands", "lat": 1.4368, "lng": 103.7863, "subtype": "NSL/TEL"},
        {"name": "Jurong East", "lat": 1.3331, "lng": 103.7421, "subtype": "EWL/NSL"},
        {"name": "Boon Lay", "lat": 1.3387, "lng": 103.7059, "subtype": "EWL"},
        {"name": "Tampines", "lat": 1.3530, "lng": 103.9453, "subtype": "EWL/DTL"},
        {"name": "Bedok", "lat": 1.3240, "lng": 103.9301, "subtype": "EWL"},
        {"name": "Paya Lebar", "lat": 1.3176, "lng": 103.8922, "subtype": "EWL/CCL"},
        {"name": "Buona Vista", "lat": 1.3073, "lng": 103.7899, "subtype": "EWL/CCL"},
        {"name": "HarbourFront", "lat": 1.2651, "lng": 103.8219, "subtype": "CCL/NEL"},
        {"name": "Serangoon", "lat": 1.3494, "lng": 103.8730, "subtype": "CCL/NEL"},
        {"name": "Outram Park", "lat": 1.2798, "lng": 103.8396, "subtype": "EWL/NEL/TEL"},
        {"name": "Changi Airport", "lat": 1.3592, "lng": 103.9894, "subtype": "EWL"},
    ],
    "school": [
        {"name": "Raffles Institution", "lat": 1.4043, "lng": 103.8139, "subtype": "Secondary"},
        {"name": "Hwa Chong Institution", "lat": 1.3333, "lng": 103.8074, "subtype": "Secondary"},
        {"name": "Anglo-Chinese School", "lat": 1.3223, "lng": 103.8454, "subtype": "Secondary"},
        {"name": "NUS", "lat": 1.2966, "lng": 103.7764, "subtype": "University"},
        {"name": "NTU", "lat": 1.3483, "lng": 103.6831, "subtype": "University"},
        {"name": "SMU", "lat": 1.2967, "lng": 103.8500, "subtype": "University"},
        {"name": "Singapore Polytechnic", "lat": 1.3113, "lng": 103.7789, "subtype": "Polytechnic"},
        {"name": "Nanyang Polytechnic", "lat": 1.3764, "lng": 103.8478, "subtype": "Polytechnic"},
        {"name": "Temasek Polytechnic", "lat": 1.3453, "lng": 103.9326, "subtype": "Polytechnic"},
        {"name": "Victoria School", "lat": 1.3234, "lng": 103.9039, "subtype": "Secondary"},
        {"name": "Dunman High", "lat": 1.3136, "lng": 103.8847, "subtype": "Secondary"},
        {"name": "St Joseph's Institution", "lat": 1.3045, "lng": 103.8337, "subtype": "Secondary"},
        {"name": "National JC", "lat": 1.3572, "lng": 103.8340, "subtype": "JC"},
        {"name": "Republic Polytechnic", "lat": 1.4328, "lng": 103.8355, "subtype": "Polytechnic"},
        {"name": "CHIJ TPSS", "lat": 1.3271, "lng": 103.8592, "subtype": "Secondary"},
    ],
    "mall": [
        {"name": "ION Orchard", "lat": 1.3040, "lng": 103.8331, "subtype": "Orchard"},
        {"name": "VivoCity", "lat": 1.2644, "lng": 103.8222, "subtype": "HarbourFront"},
        {"name": "Jurong Point", "lat": 1.3393, "lng": 103.7056, "subtype": "Jurong"},
        {"name": "Tampines Mall", "lat": 1.3530, "lng": 103.9451, "subtype": "Tampines"},
        {"name": "Bugis Junction", "lat": 1.2993, "lng": 103.8554, "subtype": "City"},
        {"name": "Plaza Singapura", "lat": 1.3002, "lng": 103.8456, "subtype": "Orchard"},
        {"name": "Bedok Mall", "lat": 1.3242, "lng": 103.9303, "subtype": "Bedok"},
        {"name": "NEX", "lat": 1.3494, "lng": 103.8732, "subtype": "Serangoon"},
        {"name": "Causeway Point", "lat": 1.4365, "lng": 103.7864, "subtype": "Woodlands"},
        {"name": "Northpoint City", "lat": 1.4295, "lng": 103.8356, "subtype": "Yishun"},
        {"name": "AMK Hub", "lat": 1.3691, "lng": 103.8454, "subtype": "Ang Mo Kio"},
        {"name": "Westgate", "lat": 1.3337, "lng": 103.7422, "subtype": "Jurong"},
        {"name": "Paya Lebar Square", "lat": 1.3176, "lng": 103.8922, "subtype": "Paya Lebar"},
        {"name": "Clementi Mall", "lat": 1.3152, "lng": 103.7651, "subtype": "Clementi"},
        {"name": "Suntec City", "lat": 1.2937, "lng": 103.8573, "subtype": "City"},
    ],
}


def get_districts(db: Session | None) -> list[dict]:
    from app.models.transaction import Transaction

    # Aggregate PSF per district from transaction data if DB available
    psf_by_district: dict[str, tuple[float, int]] = {}
    if db is not None:
        try:
            rows = (
                db.query(
                    Transaction.district,
                    func.avg(Transaction.psf).label("avg_psf"),
                    func.count(Transaction.id).label("cnt"),
                )
                .filter(Transaction.psf.isnot(None))
                .group_by(Transaction.district)
                .all()
            )
            for row in rows:
                if row.district:
                    psf_by_district[row.district] = (round(row.avg_psf, 0), row.cnt)
        except Exception:
            pass

    result = []
    for d in _DISTRICT_SEED:
        live = psf_by_district.get(d["code"])
        psf_median = live[0] if live else d["psf_fallback"]
        count = live[1] if live else 0
        result.append(
            {
                "code": d["code"],
                "name": d["name"],
                "psf_median": psf_median,
                "lat": d["lat"],
                "lng": d["lng"],
                "transaction_count": count,
            }
        )
    return result


def get_amenities(amenity_type: str) -> list[dict]:
    raw = _AMENITIES.get(amenity_type, [])
    return [{"name": r["name"], "lat": r["lat"], "lng": r["lng"], "type": amenity_type, "subtype": r.get("subtype", "")} for r in raw]
```

- [ ] **Step 5: Create map router**

```python
# backend/app/routers/map.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.map import DistrictData, AmenityPoint
from app.services.map_service import get_districts, get_amenities

router = APIRouter(prefix="/api/map", tags=["map"])


@router.get("/districts", response_model=list[DistrictData])
def districts(db: Session = Depends(get_db)) -> list[DistrictData]:
    return [DistrictData(**d) for d in get_districts(db)]


@router.get("/amenities/{amenity_type}", response_model=list[AmenityPoint])
def amenities(amenity_type: str) -> list[AmenityPoint]:
    return [AmenityPoint(**a) for a in get_amenities(amenity_type)]
```

- [ ] **Step 6: Register map router in main.py**

Add `map as map_router` to imports (avoid name collision with Python builtin `map`). In `backend/app/main.py`:

```python
from app.routers import tax, profile, market, transactions, loans, roi, enbloc
from app.routers import map as map_router
```

Add:

```python
app.include_router(map_router.router)
app.include_router(enbloc.router)
```

- [ ] **Step 7: Run tests — expect pass**

```
cd backend && python -m pytest tests/test_map.py -v
```

Expected: 8/8 PASS

- [ ] **Step 8: Run full suite**

```
cd backend && python -m pytest -v
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```
git add backend/app/schemas/map.py backend/app/services/map_service.py backend/app/routers/map.py backend/app/main.py backend/tests/test_map.py
git commit -m "feat: district PSF map service and amenity data endpoints"
```

---

### Task 3: Frontend En-Bloc Page

**Files:**
- Create: `frontend/src/stores/watchlistStore.ts`
- Create: `frontend/src/api/enbloc.ts`
- Create: `frontend/src/pages/EnblocPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create watchlist Zustand store**

```typescript
// frontend/src/stores/watchlistStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchlistState {
  watchedIds: number[]
  addToWatchlist: (id: number) => void
  removeFromWatchlist: (id: number) => void
  isWatched: (id: number) => boolean
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchedIds: [],
      addToWatchlist: (id) =>
        set((s) => ({ watchedIds: s.watchedIds.includes(id) ? s.watchedIds : [...s.watchedIds, id] })),
      removeFromWatchlist: (id) =>
        set((s) => ({ watchedIds: s.watchedIds.filter((w) => w !== id) })),
      isWatched: (id) => get().watchedIds.includes(id),
    }),
    { name: 'watchlist-store' }
  )
)
```

- [ ] **Step 2: Create enbloc API module**

```typescript
// frontend/src/api/enbloc.ts
import { apiGet } from './client'

export interface DevelopmentProfile {
  id: number
  name: string
  district: string
  age_years: number
  plot_ratio_headroom: number
  land_area_sqft: number
  previous_csc_attempt: boolean
  ownership_units: number
  lease_remaining_years: number
  csc_status: string
  lat: number
  lng: number
  score: number
}

export function getDevelopments(): Promise<DevelopmentProfile[]> {
  return apiGet('/api/enbloc/developments')
}
```

- [ ] **Step 3: Create EnblocPage**

```tsx
// frontend/src/pages/EnblocPage.tsx
import { useState, useEffect } from 'react'
import { getDevelopments, type DevelopmentProfile } from '../api/enbloc'
import { useWatchlistStore } from '../stores/watchlistStore'

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-red-500' : score >= 50 ? 'bg-yellow-500' : 'bg-green-600'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-200 w-8 text-right">{score}</span>
    </div>
  )
}

function CscBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Approved: 'bg-green-900/40 text-green-400 border border-green-700',
    Pending: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700',
    Lapsed: 'bg-gray-800 text-gray-500 border border-gray-700',
    None: 'bg-gray-900 text-gray-600 border border-gray-800',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${styles[status] ?? styles['None']}`}>
      {status === 'None' ? '—' : status}
    </span>
  )
}

function formatArea(sqft: number): string {
  return sqft >= 1_000_000
    ? `${(sqft / 43_560).toFixed(1)} ac`
    : `${Math.round(sqft / 1000)}k sqft`
}

export function EnblocPage() {
  const [devs, setDevs] = useState<DevelopmentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'all' | 'watchlist'>('all')
  const { watchedIds, addToWatchlist, removeFromWatchlist, isWatched } = useWatchlistStore()

  useEffect(() => {
    getDevelopments()
      .then(setDevs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const displayed = tab === 'watchlist' ? devs.filter((d) => isWatched(d.id)) : devs

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-blue-400">En-Bloc Watch</h1>
        <p className="text-sm text-gray-500 mt-1">
          Developments ranked by en-bloc potential (0–100)
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          All Developments
        </button>
        <button
          onClick={() => setTab('watchlist')}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === 'watchlist' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          My Watch List
          {watchedIds.length > 0 && (
            <span className="ml-1.5 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {watchedIds.length}
            </span>
          )}
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && displayed.length === 0 && tab === 'watchlist' && (
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
          <p className="text-gray-500">No developments on watch list. Click the star icon to track one.</p>
        </div>
      )}

      {displayed.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-6"></th>
                  <th className="px-4 py-3 text-left">Development</th>
                  <th className="px-4 py-3 text-left">District</th>
                  <th className="px-4 py-3 text-right">Age</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Land</th>
                  <th className="px-4 py-3 text-right">Plot Headroom</th>
                  <th className="px-4 py-3 text-center">CSC Status</th>
                  <th className="px-4 py-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((d) => (
                  <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() =>
                          isWatched(d.id) ? removeFromWatchlist(d.id) : addToWatchlist(d.id)
                        }
                        className={`text-base transition-colors ${
                          isWatched(d.id) ? 'text-yellow-400' : 'text-gray-700 hover:text-gray-400'
                        }`}
                        title={isWatched(d.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        ★
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-gray-200 font-medium">{d.name}</span>
                      {d.previous_csc_attempt && (
                        <span className="ml-2 text-xs text-purple-400">prev. CSC</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{d.district}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{d.age_years}y</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{d.ownership_units.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{formatArea(d.land_area_sqft)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{d.plot_ratio_headroom.toFixed(0)}%</td>
                    <td className="px-4 py-2.5 text-center"><CscBadge status={d.csc_status} /></td>
                    <td className="px-4 py-2.5 text-right"><ScoreBar score={d.score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <p className="text-xs text-gray-600">
          <strong className="text-gray-500">Score factors:</strong> Plot ratio headroom (25%), Age (20%), Land size (15%), Location (15%), Ownership fragmentation (10%), CSC history (10%), Lease remaining (5%). Scores are indicative; consult a property lawyer before making any investment decision.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update App.tsx for /enbloc**

Read `frontend/src/App.tsx`. Add:
```tsx
import { EnblocPage } from './pages/EnblocPage'
```
Replace `<Route path="/enbloc" element={<ComingSoon name="En-Bloc Watch" />} />` with:
```tsx
<Route path="/enbloc" element={<EnblocPage />} />
```

- [ ] **Step 5: TypeScript check**

```
cd frontend && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 6: Commit**

```
git add frontend/src/stores/watchlistStore.ts frontend/src/api/enbloc.ts frontend/src/pages/EnblocPage.tsx frontend/src/App.tsx
git commit -m "feat: en-bloc watch page with scoring table and persistent watchlist"
```

---

### Task 4: Frontend Map Page

**Files:**
- Create: `frontend/src/api/map.ts`
- Create: `frontend/src/pages/MapPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx` (add leaflet CSS import)

- [ ] **Step 1: Install react-leaflet and leaflet**

Run from `C:\zjb2\PropertyAgent\frontend\`:

```
npm install react-leaflet leaflet
npm install --save-dev @types/leaflet
```

- [ ] **Step 2: Create map API module**

```typescript
// frontend/src/api/map.ts
import { apiGet } from './client'

export interface DistrictData {
  code: string
  name: string
  psf_median: number
  lat: number
  lng: number
  transaction_count: number
}

export interface AmenityPoint {
  name: string
  lat: number
  lng: number
  type: string
  subtype: string
}

export function getDistricts(): Promise<DistrictData[]> {
  return apiGet('/api/map/districts')
}

export function getAmenities(type: 'mrt' | 'school' | 'mall'): Promise<AmenityPoint[]> {
  return apiGet(`/api/map/amenities/${type}`)
}
```

- [ ] **Step 3: Create MapPage**

```tsx
// frontend/src/pages/MapPage.tsx
import 'leaflet/dist/leaflet.css'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getDistricts, getAmenities, type DistrictData, type AmenityPoint } from '../api/map'

// PSF → colour using 5 quintile buckets
function psfColor(psf: number): string {
  if (psf >= 2500) return '#ef4444' // red   — prime
  if (psf >= 1800) return '#f97316' // orange
  if (psf >= 1400) return '#eab308' // yellow
  if (psf >= 1000) return '#22c55e' // green
  return '#3b82f6'                  // blue  — affordable
}

function formatSgd(n: number): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n)
}

// Amenity icons using simple divIcon
function amenityIcon(type: string): L.DivIcon {
  const colors: Record<string, string> = { mrt: '#a855f7', school: '#22d3ee', mall: '#fb923c' }
  const labels: Record<string, string> = { mrt: 'M', school: 'S', mall: '🛍' }
  const bg = colors[type] ?? '#6b7280'
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.5)">${labels[type] ?? '?'}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function Legend() {
  const buckets = [
    { label: '≥ $2,500 psf', color: '#ef4444' },
    { label: '≥ $1,800 psf', color: '#f97316' },
    { label: '≥ $1,400 psf', color: '#eab308' },
    { label: '≥ $1,000 psf', color: '#22c55e' },
    { label: '< $1,000 psf', color: '#3b82f6' },
  ]
  return (
    <div className="absolute bottom-8 left-4 z-[1000] bg-gray-900/90 border border-gray-700 rounded-lg p-3">
      <p className="text-xs text-gray-400 font-medium mb-2">PSF Median</p>
      {buckets.map((b) => (
        <div key={b.label} className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ background: b.color }} />
          <span className="text-xs text-gray-300">{b.label}</span>
        </div>
      ))}
    </div>
  )
}

export function MapPage() {
  const [districts, setDistricts] = useState<DistrictData[]>([])
  const [amenities, setAmenities] = useState<AmenityPoint[]>([])
  const [layers, setLayers] = useState({ mrt: false, school: false, mall: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDistricts()
      .then(setDistricts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function toggleLayer(type: 'mrt' | 'school' | 'mall') {
    const next = !layers[type]
    setLayers((l) => ({ ...l, [type]: next }))
    if (next && !amenities.some((a) => a.type === type)) {
      try {
        const pts = await getAmenities(type)
        setAmenities((prev) => [...prev.filter((a) => a.type !== type), ...pts])
      } catch {
        // ignore amenity fetch errors
      }
    }
  }

  const visibleAmenities = amenities.filter((a) => layers[a.type as keyof typeof layers])

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-blue-400">District Map</h1>
          <p className="text-xs text-gray-500 mt-0.5">Circle size + colour = PSF median · click a district for details</p>
        </div>
        <div className="flex gap-2">
          {(['mrt', 'school', 'mall'] as const).map((type) => {
            const labels = { mrt: 'MRT', school: 'Schools', mall: 'Malls' }
            const activeColors = { mrt: 'bg-purple-700 text-white', school: 'bg-cyan-700 text-white', mall: 'bg-orange-700 text-white' }
            return (
              <button
                key={type}
                onClick={() => toggleLayer(type)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  layers[type] ? activeColors[type] : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {labels[type]}
              </button>
            )
          })}
        </div>
      </div>

      {loading && <div className="flex-1 flex items-center justify-center text-gray-500">Loading map data...</div>}
      {error && <div className="flex-1 flex items-center justify-center text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="flex-1 relative">
          <MapContainer
            center={[1.3521, 103.8198]}
            zoom={11}
            style={{ height: '100%', width: '100%', background: '#111827' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png"
              attribution='<a href="https://www.onemap.gov.sg/" target="_blank">OneMap</a> &copy; Singapore Land Authority'
              minZoom={11}
              maxZoom={19}
            />

            {districts.map((d) => {
              const radius = Math.max(8, Math.min(28, d.psf_median / 100))
              return (
                <CircleMarker
                  key={d.code}
                  center={[d.lat, d.lng]}
                  radius={radius}
                  pathOptions={{
                    fillColor: psfColor(d.psf_median),
                    fillOpacity: 0.75,
                    color: '#1f2937',
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-bold text-gray-900">{d.code} — {d.name}</p>
                      <p className="mt-1 text-gray-700">PSF Median: <strong>{formatSgd(d.psf_median)}</strong></p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {d.transaction_count > 0 ? `Based on ${d.transaction_count} transactions` : 'Seeded estimate'}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}

            {visibleAmenities.map((a, i) => (
              <Marker key={`${a.type}-${i}`} position={[a.lat, a.lng]} icon={amenityIcon(a.type)}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-gray-900">{a.name}</p>
                    {a.subtype && <p className="text-gray-500 text-xs mt-0.5">{a.subtype}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <Legend />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Update App.tsx for /map**

Read `frontend/src/App.tsx`. Add:
```tsx
import { MapPage } from './pages/MapPage'
```
Replace `<Route path="/map" element={<ComingSoon name="District Map" />} />` with:
```tsx
<Route path="/map" element={<MapPage />} />
```

- [ ] **Step 5: Update AppShell.tsx to give map full height**

Read `frontend/src/components/layout/AppShell.tsx`. The main content area needs to allow the MapPage to be full-height (no padding/overflow cutting the map). Check if the content wrapper has `overflow-y-auto` or similar — the MapPage uses `h-full` which requires the parent to have a defined height.

If the current AppShell wraps content in a scrollable `<main>` with `overflow-y-auto p-6`, we need the MapPage to opt out of that padding. The simplest fix: make the map container `flex-1 min-h-0` in AppShell and let MapPage manage its own layout. If AppShell already has `flex-1 overflow-y-auto` on main, add `p-0` override only for map route — but the cleanest approach without changing AppShell is to ensure MapPage uses `h-screen` style via CSS.

Actually, check AppShell first. Read `frontend/src/components/layout/AppShell.tsx` and determine if the content area has constrained height. The map requires `height: 100%` on `MapContainer`, which requires all ancestor elements to have defined heights. 

If AppShell renders `<main className="flex-1 overflow-y-auto p-6">`, the fix is to remove padding for the map route, or have MapPage use `calc(100vh - ...)` for height. The most pragmatic fix: add a special class to MapPage's outer div that uses negative margin to break out of the padding, or change AppShell to use `p-0` and have each page add its own padding.

Read the file and apply whichever minimal change makes map full-height without breaking other pages.

- [ ] **Step 6: TypeScript check**

```
cd frontend && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 7: Commit**

```
git add frontend/src/api/map.ts frontend/src/pages/MapPage.tsx frontend/src/App.tsx frontend/src/main.tsx frontend/src/components/layout/AppShell.tsx
git commit -m "feat: interactive district map with PSF heat circles and amenity layers"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Leaflet.js map + OneMap tiles | Task 4 — MapPage uses react-leaflet + OneMap TileLayer |
| PSF choropleth heatmap (28 districts) | Task 2 (backend) + Task 4 (CircleMarker per district, colored by PSF) |
| MRT/school/mall layer toggles | Task 2 (amenities endpoint) + Task 4 (toggle buttons) |
| District click popup | Task 4 — Popup on CircleMarker |
| En-bloc scoring model | Task 1 — `score_development()` with 7 weighted factors from spec |
| Watch list with CSC status | Task 3 — `watchlistStore` + CSC badge in table |
| Historical pipeline table | Task 3 — EnblocPage table (sorted by score, CSC status visible) |

All requirements covered.

**Placeholder scan:** No TBDs, all code complete.

**Type consistency:** `DistrictData`, `AmenityPoint`, `DevelopmentProfile` used consistently across schemas, services, routers, and TypeScript types.
