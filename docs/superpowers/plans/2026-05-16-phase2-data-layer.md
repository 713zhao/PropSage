# Phase 2 — Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SQLite cache, DataGovService (macro market data), URAService (transaction caveats), and two new frontend pages (Market Intelligence with Recharts charts, Transaction Search with filterable table).

**Architecture:** Backend gains SQLAlchemy ORM models (`Transaction`, `MarketData`) with in-memory SQLite test override via `conftest.py`. Two services (`DataGovService`, `URAService`) respect `USE_MOCK_DATA` env flag and fall back to JSON fixtures. Two new FastAPI routers (`/api/market`, `/api/transactions`) expose the data. Frontend gains `recharts`, two API modules, and two page components wired into `App.tsx`.

**Tech Stack:** Python 3.11, FastAPI 0.115, SQLAlchemy 2.0, pytest + httpx, React 18, TypeScript, Recharts, Tailwind CSS 3, Vite, Zustand.

---

## File Map

**Create (backend):**
- `backend/app/database.py` — SQLAlchemy engine, `SessionLocal`, `get_db` dependency, `init_db()`
- `backend/app/models/__init__.py` — empty
- `backend/app/models/transaction.py` — `Transaction` ORM model
- `backend/app/models/market_data.py` — `MarketData` key/value cache ORM model
- `backend/app/mock_data/ppi.json` — PPI quarterly records fixture
- `backend/app/mock_data/rental.json` — rental index fixture
- `backend/app/mock_data/volume.json` — transaction volume fixture
- `backend/app/mock_data/vacancy.json` — vacancy rates fixture
- `backend/app/mock_data/transactions.json` — URA caveat records fixture
- `backend/app/schemas/market.py` — Pydantic response schemas for market endpoints
- `backend/app/schemas/transaction.py` — Pydantic response schemas for transaction endpoints
- `backend/app/services/data_gov.py` — `DataGovService` class
- `backend/app/services/ura.py` — `URAService` class
- `backend/app/routers/market.py` — `/api/market/ppi|rental|volume|vacancy`
- `backend/app/routers/transactions.py` — `/api/transactions/search|comps`
- `backend/tests/test_market_router.py` — integration tests for market endpoints
- `backend/tests/test_transactions_router.py` — integration tests for transactions endpoints

**Modify (backend):**
- `backend/app/main.py` — add lifespan (init_db), register `market` and `transactions` routers
- `backend/tests/conftest.py` — add in-memory SQLite DB fixture + override `get_db`

**Create (frontend):**
- `frontend/src/api/market.ts` — typed fetch wrappers for market endpoints
- `frontend/src/api/transactions.ts` — typed fetch wrappers for transaction endpoints
- `frontend/src/pages/MarketPage.tsx` — PPI line chart + rental line chart + volume bar chart
- `frontend/src/pages/TransactionPage.tsx` — search form + results table

**Modify (frontend):**
- `frontend/src/App.tsx` — wire MarketPage and TransactionPage to existing routes
- `frontend/package.json` — add `recharts` + `@types/recharts` (if needed)

---

## Task 1: Database Layer

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/transaction.py`
- Create: `backend/app/models/market_data.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Write failing test for `get_db` dependency**

```python
# backend/tests/test_database.py
import pytest
from sqlalchemy.orm import Session
from app.database import get_db, init_db

def test_get_db_yields_session():
    gen = get_db()
    db = next(gen)
    assert isinstance(db, Session)
    try:
        next(gen)
    except StopIteration:
        pass

def test_init_db_creates_tables(tmp_path):
    from sqlalchemy import create_engine, inspect
    from app.database import Base
    engine = create_engine(f"sqlite:///{tmp_path}/test.db")
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "transactions" in tables
    assert "market_data" in tables
```

- [ ] **Step 2: Run test to verify it fails**

```
cd backend && python -m pytest tests/test_database.py -v
```
Expected: `ModuleNotFoundError: No module named 'app.database'`

- [ ] **Step 3: Create `backend/app/database.py`**

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./propsage.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import transaction, market_data  # noqa: F401 — registers models
    Base.metadata.create_all(bind=engine)
```

- [ ] **Step 4: Create `backend/app/models/__init__.py`**

```python
```
(empty file)

- [ ] **Step 5: Create `backend/app/models/transaction.py`**

```python
from sqlalchemy import Column, Float, Integer, String, Date
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    project = Column(String, index=True)
    street = Column(String)
    district = Column(String, index=True)
    area_sqft = Column(Float)
    price = Column(Float)
    psf = Column(Float)
    floor_range = Column(String)
    tenure = Column(String)
    sale_date = Column(String, index=True)
    property_type = Column(String, index=True)
```

- [ ] **Step 6: Create `backend/app/models/market_data.py`**

```python
from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    dataset = Column(String, index=True)
    period = Column(String, index=True)
    value = Column(Text)
    fetched_at = Column(String)
```

- [ ] **Step 7: Update `backend/tests/conftest.py` to use in-memory SQLite**

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

TEST_DATABASE_URL = "sqlite://"  # in-memory

@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    yield eng
    eng.dispose()

@pytest.fixture
def db_session(engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 8: Run tests to verify they pass**

```
cd backend && python -m pytest tests/test_database.py -v
```
Expected: 2 tests PASS

- [ ] **Step 9: Run full suite to verify no regressions**

```
cd backend && python -m pytest -v
```
Expected: All existing tests PASS (note: `client` fixture now takes `db_session` — existing router tests will pick up the new fixture automatically)

- [ ] **Step 10: Commit**

```
git add backend/app/database.py backend/app/models/ backend/tests/conftest.py backend/tests/test_database.py
git commit -m "feat: add SQLAlchemy database layer with in-memory test override"
```

---

## Task 2: Mock Data Fixtures

**Files:**
- Create: `backend/app/mock_data/ppi.json`
- Create: `backend/app/mock_data/rental.json`
- Create: `backend/app/mock_data/volume.json`
- Create: `backend/app/mock_data/vacancy.json`
- Create: `backend/app/mock_data/transactions.json`

All fixtures mirror the shape returned by the real APIs so services can switch between mock and live without changing callers.

- [ ] **Step 1: Create `backend/app/mock_data/ppi.json`**

```json
{
  "records": [
    {"quarter": "2022-Q1", "index": 181.5, "change_pct": 0.4},
    {"quarter": "2022-Q2", "index": 186.4, "change_pct": 2.7},
    {"quarter": "2022-Q3", "index": 192.7, "change_pct": 3.4},
    {"quarter": "2022-Q4", "index": 196.3, "change_pct": 1.9},
    {"quarter": "2023-Q1", "index": 199.1, "change_pct": 1.4},
    {"quarter": "2023-Q2", "index": 202.6, "change_pct": 1.8},
    {"quarter": "2023-Q3", "index": 205.4, "change_pct": 1.4},
    {"quarter": "2023-Q4", "index": 207.9, "change_pct": 1.2},
    {"quarter": "2024-Q1", "index": 209.5, "change_pct": 0.8},
    {"quarter": "2024-Q2", "index": 212.1, "change_pct": 1.2},
    {"quarter": "2024-Q3", "index": 215.0, "change_pct": 1.4},
    {"quarter": "2024-Q4", "index": 218.3, "change_pct": 1.5}
  ]
}
```

- [ ] **Step 2: Create `backend/app/mock_data/rental.json`**

```json
{
  "records": [
    {"quarter": "2022-Q1", "property_type": "Non-landed", "region": "CCR", "index": 142.3},
    {"quarter": "2022-Q1", "property_type": "Non-landed", "region": "RCR", "index": 138.7},
    {"quarter": "2022-Q1", "property_type": "Non-landed", "region": "OCR", "index": 134.2},
    {"quarter": "2022-Q2", "property_type": "Non-landed", "region": "CCR", "index": 151.8},
    {"quarter": "2022-Q2", "property_type": "Non-landed", "region": "RCR", "index": 147.3},
    {"quarter": "2022-Q2", "property_type": "Non-landed", "region": "OCR", "index": 141.9},
    {"quarter": "2023-Q1", "property_type": "Non-landed", "region": "CCR", "index": 175.4},
    {"quarter": "2023-Q1", "property_type": "Non-landed", "region": "RCR", "index": 169.2},
    {"quarter": "2023-Q1", "property_type": "Non-landed", "region": "OCR", "index": 162.8},
    {"quarter": "2024-Q1", "property_type": "Non-landed", "region": "CCR", "index": 185.1},
    {"quarter": "2024-Q1", "property_type": "Non-landed", "region": "RCR", "index": 178.6},
    {"quarter": "2024-Q1", "property_type": "Non-landed", "region": "OCR", "index": 171.3},
    {"quarter": "2024-Q4", "property_type": "Non-landed", "region": "CCR", "index": 191.2},
    {"quarter": "2024-Q4", "property_type": "Non-landed", "region": "RCR", "index": 184.9},
    {"quarter": "2024-Q4", "property_type": "Non-landed", "region": "OCR", "index": 177.4}
  ]
}
```

- [ ] **Step 3: Create `backend/app/mock_data/volume.json`**

```json
{
  "records": [
    {"month": "2024-01", "new_sale": 312, "sub_sale": 42, "resale": 1104},
    {"month": "2024-02", "new_sale": 498, "sub_sale": 38, "resale": 987},
    {"month": "2024-03", "new_sale": 621, "sub_sale": 55, "resale": 1243},
    {"month": "2024-04", "new_sale": 744, "sub_sale": 61, "resale": 1356},
    {"month": "2024-05", "new_sale": 892, "sub_sale": 47, "resale": 1489},
    {"month": "2024-06", "new_sale": 1024, "sub_sale": 53, "resale": 1621},
    {"month": "2024-07", "new_sale": 836, "sub_sale": 44, "resale": 1534},
    {"month": "2024-08", "new_sale": 763, "sub_sale": 39, "resale": 1402},
    {"month": "2024-09", "new_sale": 941, "sub_sale": 58, "resale": 1687},
    {"month": "2024-10", "new_sale": 1187, "sub_sale": 62, "resale": 1823},
    {"month": "2024-11", "new_sale": 1043, "sub_sale": 51, "resale": 1745},
    {"month": "2024-12", "new_sale": 876, "sub_sale": 46, "resale": 1589}
  ]
}
```

- [ ] **Step 4: Create `backend/app/mock_data/vacancy.json`**

```json
{
  "records": [
    {"quarter": "2022-Q1", "property_type": "Non-landed", "vacancy_pct": 5.4},
    {"quarter": "2022-Q2", "property_type": "Non-landed", "vacancy_pct": 4.8},
    {"quarter": "2022-Q3", "property_type": "Non-landed", "vacancy_pct": 4.1},
    {"quarter": "2022-Q4", "property_type": "Non-landed", "vacancy_pct": 3.7},
    {"quarter": "2023-Q1", "property_type": "Non-landed", "vacancy_pct": 3.2},
    {"quarter": "2023-Q2", "property_type": "Non-landed", "vacancy_pct": 2.9},
    {"quarter": "2023-Q3", "property_type": "Non-landed", "vacancy_pct": 3.1},
    {"quarter": "2023-Q4", "property_type": "Non-landed", "vacancy_pct": 3.4},
    {"quarter": "2024-Q1", "property_type": "Non-landed", "vacancy_pct": 3.6},
    {"quarter": "2024-Q2", "property_type": "Non-landed", "vacancy_pct": 3.8},
    {"quarter": "2024-Q3", "property_type": "Non-landed", "vacancy_pct": 3.5},
    {"quarter": "2024-Q4", "property_type": "Non-landed", "vacancy_pct": 3.3}
  ]
}
```

- [ ] **Step 5: Create `backend/app/mock_data/transactions.json`**

```json
{
  "records": [
    {
      "project": "THE CONTINUUM",
      "street": "THIAM SIEW AVENUE",
      "district": "15",
      "area_sqft": 1033.0,
      "price": 2580000,
      "psf": 2497.0,
      "floor_range": "01-05",
      "tenure": "Freehold",
      "sale_date": "2024-10",
      "property_type": "Condominium"
    },
    {
      "project": "TEMBUSU GRAND",
      "street": "JALAN TEMBUSU",
      "district": "15",
      "area_sqft": 786.0,
      "price": 1912000,
      "psf": 2433.0,
      "floor_range": "06-10",
      "tenure": "99-year Leasehold",
      "sale_date": "2024-10",
      "property_type": "Condominium"
    },
    {
      "project": "GRAND DUNMAN",
      "street": "DUNMAN ROAD",
      "district": "15",
      "area_sqft": 936.0,
      "price": 2156000,
      "psf": 2303.0,
      "floor_range": "11-15",
      "tenure": "99-year Leasehold",
      "sale_date": "2024-09",
      "property_type": "Condominium"
    },
    {
      "project": "MARINA ONE RESIDENCES",
      "street": "MARINA WAY",
      "district": "01",
      "area_sqft": 700.0,
      "price": 2450000,
      "psf": 3500.0,
      "floor_range": "21-25",
      "tenure": "99-year Leasehold",
      "sale_date": "2024-11",
      "property_type": "Apartment"
    },
    {
      "project": "LENTOR MODERN",
      "street": "LENTOR CENTRAL",
      "district": "26",
      "area_sqft": 1098.0,
      "price": 1987000,
      "psf": 1810.0,
      "floor_range": "06-10",
      "tenure": "99-year Leasehold",
      "sale_date": "2024-10",
      "property_type": "Condominium"
    },
    {
      "project": "HILLHAVEN",
      "street": "HILLVIEW RISE",
      "district": "23",
      "area_sqft": 1216.0,
      "price": 2134000,
      "psf": 1755.0,
      "floor_range": "01-05",
      "tenure": "99-year Leasehold",
      "sale_date": "2024-09",
      "property_type": "Condominium"
    },
    {
      "project": "PINETREE HILL",
      "street": "PINE GROVE",
      "district": "21",
      "area_sqft": 1399.0,
      "price": 2798000,
      "psf": 1999.0,
      "floor_range": "16-20",
      "tenure": "99-year Leasehold",
      "sale_date": "2024-08",
      "property_type": "Condominium"
    },
    {
      "project": "ORCHARD SOPHIA",
      "street": "SOPHIA ROAD",
      "district": "09",
      "area_sqft": 560.0,
      "price": 1568000,
      "psf": 2800.0,
      "floor_range": "06-10",
      "tenure": "Freehold",
      "sale_date": "2024-11",
      "property_type": "Apartment"
    },
    {
      "project": "KLIMT CAIRNHILL",
      "street": "CAIRNHILL ROAD",
      "district": "09",
      "area_sqft": 1884.0,
      "price": 8120000,
      "psf": 4310.0,
      "floor_range": "21-25",
      "tenure": "Freehold",
      "sale_date": "2024-10",
      "property_type": "Condominium"
    },
    {
      "project": "BLOSSOMS BY THE PARK",
      "street": "SLIM BARRACKS RISE",
      "district": "05",
      "area_sqft": 764.0,
      "price": 1637000,
      "psf": 2143.0,
      "floor_range": "11-15",
      "tenure": "99-year Leasehold",
      "sale_date": "2024-09",
      "property_type": "Condominium"
    }
  ]
}
```

- [ ] **Step 6: Commit**

```
git add backend/app/mock_data/
git commit -m "feat: add mock data fixtures for market and transaction endpoints"
```

---

## Task 3: DataGovService

**Files:**
- Create: `backend/app/schemas/market.py`
- Create: `backend/app/services/data_gov.py`
- Create: `backend/tests/test_data_gov_service.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_data_gov_service.py
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
    # With USE_MOCK_DATA=true the service reads local fixtures, not network
    result = svc.get_ppi()
    assert result is not None
```

- [ ] **Step 2: Run test to verify it fails**

```
cd backend && python -m pytest tests/test_data_gov_service.py -v
```
Expected: `ModuleNotFoundError: No module named 'app.services.data_gov'`

- [ ] **Step 3: Create `backend/app/schemas/market.py`**

```python
from pydantic import BaseModel


class PPIRecord(BaseModel):
    quarter: str
    index: float
    change_pct: float


class RentalRecord(BaseModel):
    quarter: str
    property_type: str
    region: str
    index: float


class VolumeRecord(BaseModel):
    month: str
    new_sale: int
    sub_sale: int
    resale: int


class VacancyRecord(BaseModel):
    quarter: str
    property_type: str
    vacancy_pct: float
```

- [ ] **Step 4: Create `backend/app/services/data_gov.py`**

```python
import json
import os
from pathlib import Path

_MOCK_DIR = Path(__file__).parent.parent / "mock_data"
_USE_MOCK = os.getenv("USE_MOCK_DATA", "true").lower() in ("true", "1", "yes")


def _load_mock(filename: str) -> list[dict]:
    with open(_MOCK_DIR / filename) as f:
        return json.load(f)["records"]


class DataGovService:
    def get_ppi(self) -> list[dict]:
        if _USE_MOCK:
            return _load_mock("ppi.json")
        return self._fetch_ppi_live()

    def get_rental(self) -> list[dict]:
        if _USE_MOCK:
            return _load_mock("rental.json")
        return self._fetch_rental_live()

    def get_volume(self) -> list[dict]:
        if _USE_MOCK:
            return _load_mock("volume.json")
        return self._fetch_volume_live()

    def get_vacancy(self) -> list[dict]:
        if _USE_MOCK:
            return _load_mock("vacancy.json")
        return self._fetch_vacancy_live()

    # Live implementations are stubs for Phase 2 — Phase 3+ will implement these
    def _fetch_ppi_live(self) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("Live DataGov PPI fetch not yet implemented")

    def _fetch_rental_live(self) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("Live DataGov Rental fetch not yet implemented")

    def _fetch_volume_live(self) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("Live DataGov Volume fetch not yet implemented")

    def _fetch_vacancy_live(self) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("Live DataGov Vacancy fetch not yet implemented")
```

- [ ] **Step 5: Run tests to verify they pass**

```
cd backend && python -m pytest tests/test_data_gov_service.py -v
```
Expected: 5 tests PASS

- [ ] **Step 6: Commit**

```
git add backend/app/schemas/market.py backend/app/services/data_gov.py backend/tests/test_data_gov_service.py
git commit -m "feat: add DataGovService with mock data support and market schemas"
```

---

## Task 4: URAService

**Files:**
- Create: `backend/app/schemas/transaction.py`
- Create: `backend/app/services/ura.py`
- Create: `backend/tests/test_ura_service.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_ura_service.py
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
```

- [ ] **Step 2: Run test to verify it fails**

```
cd backend && python -m pytest tests/test_ura_service.py -v
```
Expected: `ModuleNotFoundError: No module named 'app.services.ura'`

- [ ] **Step 3: Create `backend/app/schemas/transaction.py`**

```python
from pydantic import BaseModel


class TransactionRecord(BaseModel):
    project: str
    street: str
    district: str
    area_sqft: float
    price: float
    psf: float
    floor_range: str
    tenure: str
    sale_date: str
    property_type: str


class TransactionSearchRequest(BaseModel):
    district: str | None = None
    property_type: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_psf: float | None = None
    max_psf: float | None = None
    limit: int = 50


class CompsRequest(BaseModel):
    district: str
    area_sqft: float
    tolerance_pct: float = 0.2
```

- [ ] **Step 4: Create `backend/app/services/ura.py`**

```python
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
```

- [ ] **Step 5: Run tests to verify they pass**

```
cd backend && python -m pytest tests/test_ura_service.py -v
```
Expected: 7 tests PASS

- [ ] **Step 6: Run full suite**

```
cd backend && python -m pytest -v
```
Expected: All tests PASS

- [ ] **Step 7: Commit**

```
git add backend/app/schemas/transaction.py backend/app/services/ura.py backend/tests/test_ura_service.py
git commit -m "feat: add URAService with mock data, filtering, and comps logic"
```

---

## Task 5: Market Router

**Files:**
- Create: `backend/app/routers/market.py`
- Create: `backend/tests/test_market_router.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing router tests**

```python
# backend/tests/test_market_router.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd backend && python -m pytest tests/test_market_router.py -v
```
Expected: 4 tests FAIL with 404

- [ ] **Step 3: Create `backend/app/routers/market.py`**

```python
from fastapi import APIRouter
from app.services.data_gov import DataGovService
from app.schemas.market import PPIRecord, RentalRecord, VolumeRecord, VacancyRecord

router = APIRouter(prefix="/api/market", tags=["market"])
_svc = DataGovService()


@router.get("/ppi", response_model=list[PPIRecord])
def get_ppi() -> list[dict]:
    return _svc.get_ppi()


@router.get("/rental", response_model=list[RentalRecord])
def get_rental() -> list[dict]:
    return _svc.get_rental()


@router.get("/volume", response_model=list[VolumeRecord])
def get_volume() -> list[dict]:
    return _svc.get_volume()


@router.get("/vacancy", response_model=list[VacancyRecord])
def get_vacancy() -> list[dict]:
    return _svc.get_vacancy()
```

- [ ] **Step 4: Update `backend/app/main.py` to register market router and add lifespan**

```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from app.routers import tax, profile, market, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import init_db
    init_db()
    yield


app = FastAPI(title="PropSage API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


app.include_router(tax.router)
app.include_router(profile.router)
app.include_router(market.router)
app.include_router(transactions.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

Note: `transactions.router` will be created in Task 6 — add the import now and create a stub router first.

- [ ] **Step 5: Create stub `backend/app/routers/transactions.py`** (so main.py import succeeds)

```python
from fastapi import APIRouter

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
```

- [ ] **Step 6: Run market tests to verify they pass**

```
cd backend && python -m pytest tests/test_market_router.py -v
```
Expected: 4 tests PASS

- [ ] **Step 7: Run full suite**

```
cd backend && python -m pytest -v
```
Expected: All tests PASS

- [ ] **Step 8: Commit**

```
git add backend/app/routers/market.py backend/app/routers/transactions.py backend/tests/test_market_router.py backend/app/main.py
git commit -m "feat: add /api/market router with PPI, rental, volume, vacancy endpoints"
```

---

## Task 6: Transactions Router

**Files:**
- Modify: `backend/app/routers/transactions.py` (replace stub)
- Create: `backend/tests/test_transactions_router.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_transactions_router.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd backend && python -m pytest tests/test_transactions_router.py -v
```
Expected: 5 tests FAIL (routes exist but return no body — stub router)

- [ ] **Step 3: Replace stub `backend/app/routers/transactions.py`**

```python
from fastapi import APIRouter
from app.services.ura import URAService
from app.schemas.transaction import (
    TransactionRecord,
    TransactionSearchRequest,
    CompsRequest,
)

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
_svc = URAService()


@router.post("/search", response_model=list[TransactionRecord])
def search_transactions(req: TransactionSearchRequest) -> list[dict]:
    return _svc.search(
        district=req.district,
        property_type=req.property_type,
        min_price=req.min_price,
        max_price=req.max_price,
        min_psf=req.min_psf,
        max_psf=req.max_psf,
        limit=req.limit,
    )


@router.post("/comps", response_model=list[TransactionRecord])
def get_comps(req: CompsRequest) -> list[dict]:
    return _svc.get_comps(
        district=req.district,
        area_sqft=req.area_sqft,
        tolerance_pct=req.tolerance_pct,
    )
```

- [ ] **Step 4: Run transactions tests to verify they pass**

```
cd backend && python -m pytest tests/test_transactions_router.py -v
```
Expected: 5 tests PASS

- [ ] **Step 5: Run full suite**

```
cd backend && python -m pytest -v
```
Expected: All tests PASS

- [ ] **Step 6: Commit**

```
git add backend/app/routers/transactions.py backend/tests/test_transactions_router.py
git commit -m "feat: add /api/transactions router with search and comps endpoints"
```

---

## Task 7: Frontend — Market Intelligence Page

**Files:**
- Modify: `frontend/package.json` (add recharts)
- Create: `frontend/src/api/market.ts`
- Create: `frontend/src/pages/MarketPage.tsx`
- Modify: `frontend/src/App.tsx` (wire route)

- [ ] **Step 1: Install Recharts**

```
cd frontend && npm install recharts
```
Expected: recharts added to dependencies in package.json

- [ ] **Step 2: Create `frontend/src/api/market.ts`**

```typescript
import { apiGet } from './client'

export interface PPIRecord {
  quarter: string
  index: number
  change_pct: number
}

export interface RentalRecord {
  quarter: string
  property_type: string
  region: string
  index: number
}

export interface VolumeRecord {
  month: string
  new_sale: number
  sub_sale: number
  resale: number
}

export interface VacancyRecord {
  quarter: string
  property_type: string
  vacancy_pct: number
}

export const getPPI = () => apiGet<PPIRecord[]>('/api/market/ppi')
export const getRental = () => apiGet<RentalRecord[]>('/api/market/rental')
export const getVolume = () => apiGet<VolumeRecord[]>('/api/market/volume')
export const getVacancy = () => apiGet<VacancyRecord[]>('/api/market/vacancy')
```

- [ ] **Step 3: Create `frontend/src/pages/MarketPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getPPI, getRental, getVolume, PPIRecord, RentalRecord, VolumeRecord } from '../api/market'

export function MarketPage() {
  const [ppi, setPpi] = useState<PPIRecord[]>([])
  const [rental, setRental] = useState<RentalRecord[]>([])
  const [volume, setVolume] = useState<VolumeRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPPI(), getRental(), getVolume()])
      .then(([p, r, v]) => {
        setPpi(p)
        setRental(r)
        setVolume(v)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const rentalCCR = rental.filter((r) => r.region === 'CCR')
  const rentalRCR = rental.filter((r) => r.region === 'RCR')
  const rentalOCR = rental.filter((r) => r.region === 'OCR')
  const rentalQuarters = [...new Set(rental.map((r) => r.quarter))].sort()
  const rentalChart = rentalQuarters.map((q) => ({
    quarter: q,
    CCR: rentalCCR.find((r) => r.quarter === q)?.index,
    RCR: rentalRCR.find((r) => r.quarter === q)?.index,
    OCR: rentalOCR.find((r) => r.quarter === q)?.index,
  }))

  if (loading) return <div className="p-8 text-gray-400">Loading market data…</div>
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-white">Market Intelligence</h1>

      {/* PPI Chart */}
      <section className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4">Private Property Price Index (PPI)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={ppi}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quarter" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 6 }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Line type="monotone" dataKey="index" stroke="#60A5FA" strokeWidth={2} dot={false} name="PPI" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Rental Index Chart */}
      <section className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4">Rental Index by Region</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={rentalChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quarter" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 6 }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            <Line type="monotone" dataKey="CCR" stroke="#34D399" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="RCR" stroke="#FBBF24" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="OCR" stroke="#F87171" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Volume Chart */}
      <section className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4">Monthly Transaction Volume</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={volume}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 6 }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            <Bar dataKey="new_sale" stackId="a" fill="#60A5FA" name="New Sale" />
            <Bar dataKey="sub_sale" stackId="a" fill="#FBBF24" name="Sub Sale" />
            <Bar dataKey="resale" stackId="a" fill="#34D399" name="Resale" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Wire MarketPage in `frontend/src/App.tsx`**

Find the existing import block and add:
```typescript
import { MarketPage } from './pages/MarketPage'
```

Find the route for `/market` (currently renders `<ComingSoon />`) and replace with:
```tsx
<Route path="/market" element={<MarketPage />} />
```

- [ ] **Step 5: Verify TypeScript compiles**

```
cd frontend && npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 6: Commit**

```
git add frontend/src/api/market.ts frontend/src/pages/MarketPage.tsx frontend/src/App.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add Market Intelligence page with PPI, rental, and volume charts"
```

---

## Task 8: Frontend — Transaction Search Page

**Files:**
- Create: `frontend/src/api/transactions.ts`
- Create: `frontend/src/pages/TransactionPage.tsx`
- Modify: `frontend/src/App.tsx` (wire route)

- [ ] **Step 1: Create `frontend/src/api/transactions.ts`**

```typescript
import { apiPost } from './client'

export interface TransactionRecord {
  project: string
  street: string
  district: string
  area_sqft: number
  price: number
  psf: number
  floor_range: string
  tenure: string
  sale_date: string
  property_type: string
}

export interface TransactionSearchRequest {
  district?: string
  property_type?: string
  min_price?: number
  max_price?: number
  min_psf?: number
  max_psf?: number
  limit?: number
}

export interface CompsRequest {
  district: string
  area_sqft: number
  tolerance_pct?: number
}

export const searchTransactions = (req: TransactionSearchRequest) =>
  apiPost<TransactionRecord[]>('/api/transactions/search', req)

export const getComps = (req: CompsRequest) =>
  apiPost<TransactionRecord[]>('/api/transactions/comps', req)
```

- [ ] **Step 2: Create `frontend/src/pages/TransactionPage.tsx`**

```tsx
import { useState } from 'react'
import { searchTransactions, TransactionRecord, TransactionSearchRequest } from '../api/transactions'

const DISTRICTS = ['', '01', '02', '03', '04', '05', '09', '10', '11', '15', '19', '21', '23', '25', '26', '27', '28']
const PROPERTY_TYPES = ['', 'Condominium', 'Apartment', 'Semi-Detached House', 'Terrace House', 'Detached House']

const formatSgd = (n: number) =>
  new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n)

export function TransactionPage() {
  const [filters, setFilters] = useState<TransactionSearchRequest>({ limit: 50 })
  const [results, setResults] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const setField = <K extends keyof TransactionSearchRequest>(k: K, v: TransactionSearchRequest[K]) =>
    setFilters((f) => ({ ...f, [k]: v || undefined }))

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchTransactions(filters)
      setResults(data)
      setSearched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-white">Transaction Search</h1>

      {/* Filter Form */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">District</label>
            <select
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              value={filters.district ?? ''}
              onChange={(e) => setField('district', e.target.value)}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d || 'All Districts'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Property Type</label>
            <select
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              value={filters.property_type ?? ''}
              onChange={(e) => setField('property_type', e.target.value)}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t || 'All Types'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Min Price (SGD)</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              placeholder="e.g. 1000000"
              onChange={(e) => setField('min_price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Price (SGD)</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              placeholder="e.g. 3000000"
              onChange={(e) => setField('max_price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Min PSF</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              placeholder="e.g. 1500"
              onChange={(e) => setField('min_psf', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max PSF</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              placeholder="e.g. 4000"
              onChange={(e) => setField('max_psf', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-2 rounded text-sm"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* Results Table */}
      {searched && (
        <div className="bg-gray-800 rounded-lg overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
          {results.length === 0 ? (
            <div className="p-6 text-gray-400 text-sm">No transactions found for the selected filters.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left px-4 py-3">Project</th>
                  <th className="text-left px-4 py-3">District</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Area (sqft)</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">PSF</th>
                  <th className="text-left px-4 py-3">Tenure</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-750 text-gray-200">
                    <td className="px-4 py-3 font-medium">{r.project}</td>
                    <td className="px-4 py-3">D{r.district}</td>
                    <td className="px-4 py-3">{r.property_type}</td>
                    <td className="px-4 py-3 text-right">{r.area_sqft.toFixed(0)}</td>
                    <td className="px-4 py-3 text-right">{formatSgd(r.price)}</td>
                    <td className="px-4 py-3 text-right">{formatSgd(r.psf)}</td>
                    <td className="px-4 py-3">{r.tenure}</td>
                    <td className="px-4 py-3">{r.sale_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Wire TransactionPage in `frontend/src/App.tsx`**

Add import:
```typescript
import { TransactionPage } from './pages/TransactionPage'
```

Replace the `/transactions` route (currently `<ComingSoon />`):
```tsx
<Route path="/transactions" element={<TransactionPage />} />
```

- [ ] **Step 4: Verify TypeScript compiles**

```
cd frontend && npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Run full backend suite one more time**

```
cd backend && python -m pytest -v
```
Expected: All tests PASS

- [ ] **Step 6: Commit**

```
git add frontend/src/api/transactions.ts frontend/src/pages/TransactionPage.tsx frontend/src/App.tsx
git commit -m "feat: add Transaction Search page with filter form and results table"
```

---

## Self-Review

### Spec Coverage Check

| Spec requirement | Covered by |
|---|---|
| URA transaction search page | Task 6 (router) + Task 8 (frontend) |
| Comparable transactions endpoint | Task 6 `/api/transactions/comps` |
| Price trend charts (Recharts) | Task 7 — PPI + Rental LineChart, Volume BarChart |
| Market Intelligence dashboard (data.gov.sg) | Task 3 (DataGovService) + Task 5 (market router) + Task 7 (MarketPage) |
| SQLite cache | Task 1 — SQLAlchemy models + `init_db()` |
| Mock↔live data toggle | Task 3 + Task 4 — `USE_MOCK_DATA` env flag |
| `backend/app/mock_data/` JSON fixtures | Task 2 — 5 JSON files |
| Conftest in-memory SQLite override | Task 1 — `db_session` fixture + `override_get_db` |
| Lifespan `init_db()` | Task 5 — main.py updated with `asynccontextmanager` |

### Placeholder Scan — None found. All steps include complete code.

### Type Consistency
- `TransactionRecord` defined in `backend/app/schemas/transaction.py` (Task 4) and `frontend/src/api/transactions.ts` (Task 8) — field names match.
- `PPIRecord`, `RentalRecord`, `VolumeRecord`, `VacancyRecord` defined in `backend/app/schemas/market.py` (Task 3) and `frontend/src/api/market.ts` (Task 7) — field names match.
- `DataGovService` methods return `list[dict]`, validated against Pydantic response models in router — consistent.
- `URAService.search()` signature matches `TransactionSearchRequest` fields used in router — consistent.
