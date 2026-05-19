# PropSage — Singapore Property Investment Agent
## Design Specification

**Date:** 2026-05-16  
**Status:** Approved  
**Version:** 1.0

---

## 1. Overview

PropSage is an AI-powered Singapore property investment advisor — a local-first web application that helps investors evaluate properties, calculate stamp duties, analyse market data, and get personalised AI advice. All user data (investor profile, shortlists, watch lists) is stored in the browser via Zustand + localStorage. No authentication is required for v1.

---

## 2. Architecture Decision

**Chosen approach: Monorepo — Vite React + FastAPI + SQLite**

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State management | Zustand (localStorage persistence) |
| Charts | Recharts |
| Maps | Leaflet.js + OneMap Singapore tiles |
| Backend | Python FastAPI |
| Database | SQLite (via SQLAlchemy) — migrates to PostgreSQL by swapping connection string |
| AI Engine | Google Gemini 2.5 Flash |
| Auth | None for v1 (local-state model) |

**Why this approach:**
- Zero-friction local dev: two terminal commands, no Docker needed
- SQLite removes PostgreSQL + Redis setup overhead while preserving migration path
- Zustand localStorage satisfies the local-state requirement without auth complexity
- Matches the tech stack specified in features.md (React TS, Tailwind, Recharts, Leaflet)

---

## 3. Repository Structure

```
PropertyAgent/
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # One file per route
│       ├── stores/         # Zustand stores
│       ├── hooks/          # Custom React hooks
│       ├── api/            # FastAPI client (fetch wrappers)
│       └── types/          # Shared TypeScript types
├── backend/
│   └── app/
│       ├── routers/        # FastAPI route handlers
│       ├── services/       # Business logic + external API calls
│       ├── models/         # SQLAlchemy ORM models
│       ├── mock_data/      # JSON fixtures for dev without API keys
│       └── main.py
├── .env.example            # Template with all required keys
└── README.md
```

**Start commands:**
```bash
# Terminal 1
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm install && npm run dev
```

---

## 4. Configuration (.env)

```env
# Data source toggle
USE_MOCK_DATA=true          # Set false to use live APIs

# URA Data Service (granular per-unit transactions)
URA_ACCESS_KEY=your_key_here

# AI Advisory engine
GEMINI_API_KEY=your_key_here

# OneMap (maps and amenity layers)
ONEMAP_TOKEN=your_key_here

# App
CORS_ORIGINS=http://localhost:5173
```

All keys are optional when `USE_MOCK_DATA=true`. The app starts and runs fully on mock data without any keys configured.

---

## 5. Data Sources

PropSage uses two authoritative data sources with a clean split by use case:

### 5.1 data.gov.sg — Macro Trend Data (no auth)

Public REST/CSV endpoints. No API key required. Fetched on startup and cached in SQLite.

| Dataset | Use |
|---|---|
| URA Private Property Price Index (PPI) | Market Intelligence dashboard — quarterly trend chart |
| Rental Index by Property Type & Region | Rental trend panel |
| Transaction Volume (new / sub-sale / resale) | Monthly sales volume chart |
| Vacancy Rates by Region | Supply pressure indicator |
| HDB Resale Transaction Prices | HDB resale comps |
| GLS Site Pipeline | Government Land Sales panel |

Backend service: `DataGovService`

### 5.2 URA Data Service — Granular Transaction Data (requires `URA_ACCESS_KEY`)

Official URA Realis API for individual caveat-level records.

| Dataset | Use |
|---|---|
| Private residential caveats | Transaction search — per-unit: project, floor, area, price, PSF, date, tenure |
| Comparable transactions | Comps for any target property (≥10 records) |
| District PSF medians | Heatmap colour values |
| New launch vs resale split | Developer vs secondary market per development |
| Planning / plot ratio data | En-bloc scoring model inputs |

Backend service: `URAService`  
Falls back to mock JSON when key absent or `USE_MOCK_DATA=true`. Results cached in SQLite.

### Mock data strategy

JSON fixtures in `backend/app/mock_data/` mirror the real API response shapes. A single env flag (`USE_MOCK_DATA`) controls which service implementation is injected — real or mock — via FastAPI's dependency injection. Switching to live data requires only setting the flag and providing the keys.

---

## 6. Frontend Pages (React Router)

| Route | Page | Primary data source |
|---|---|---|
| `/` | Market Intelligence Dashboard | data.gov.sg |
| `/profile` | Investor Profile setup | Local state |
| `/calculator` | Tax & Cost Calculator | Local computation |
| `/map` | District Map + Heatmap | URA Data Service + OneMap |
| `/transactions` | URA Transaction Search | URA Data Service |
| `/market` | Market Intelligence (expanded) | data.gov.sg |
| `/loans` | Loan Comparison | Static bank data + local computation |
| `/roi` | ROI Projector | Local computation |
| `/enbloc` | En-Bloc Watch List | URA Data Service + local watch list |
| `/shortlist` | Property Shortlist & Comparison | Local state + URA comps |
| `/advisor` | AI Advisory Chat | Gemini 2.5 Flash via backend |

### Zustand stores (localStorage-persisted)

| Store | Contents |
|---|---|
| `profileStore` | Citizenship, income, CPF, goals, risk profile |
| `shortlistStore` | Saved properties (up to 10), comparison state, status tags |
| `watchlistStore` | En-bloc watch list, CSC status, alert preferences |
| `chatStore` | AI conversation history (session only, not persisted) |

---

## 7. Backend API Routers (FastAPI)

| Prefix | Router | Responsibility |
|---|---|---|
| `/api/profile` | profile | TDSR / MSR / LTV calculations, affordability checks |
| `/api/tax` | tax | BSD, ABSD, SSD computation; full upfront cost summary |
| `/api/transactions` | transactions | URA caveat search, comps, price trends |
| `/api/market` | market | PPI, rental index, vacancy, GLS from data.gov.sg |
| `/api/loans` | loans | Bank package comparison, instalment calculation, refinancing model |
| `/api/roi` | roi | IRR model, cumulative return, scenario sensitivity |
| `/api/enbloc` | enbloc | Scoring model (0–100), pipeline data, CSC status |
| `/api/map` | map | District PSF aggregates for heatmap, amenity layer data |
| `/api/advisor` | advisor | Gemini 2.5 Flash proxy — injects profile + market context |

### SQLite tables

| Table | Purpose |
|---|---|
| `transactions` | Cached URA caveat records |
| `market_data` | data.gov.sg PPI, rental index, vacancy snapshots |
| `districts` | Singapore 28 postal districts with PSF medians |
| `enbloc_developments` | Development profiles, en-bloc scores, CSC status |
| `bank_rates` | Loan packages per lender (10 banks) |
| `cooling_measures` | Historical policy timeline (2009–present) |

---

## 8. AI Advisory Engine

- **Model:** Google Gemini 2.5 Flash
- **Key:** `GEMINI_API_KEY` in `.env` (stubbed when absent)
- **Flow:**
  1. User message sent to `/api/advisor`
  2. Backend assembles context: investor profile + relevant market data + active shortlist
  3. System prompt instructs Gemini to respond as a Singapore property advisor
  4. All responses include mandatory disclaimer: *"Indicative only — not financial advice"*
  5. Red flag detection: backend pre-screens inputs and appends alerts (TDSR >50%, negative cashflow, lease <30yr, etc.)
- **Session memory:** conversation history held in `chatStore` (in-memory, not persisted across browser refresh)

---

## 9. Regulatory & Tax Engine

Implemented as pure Python functions in `backend/app/services/tax.py` — no external API calls, no database reads. Inputs come from the user's profile.

### Buyer's Stamp Duty (BSD)
Tiered: 1% (first $180K) → 2% (next $180K) → 3% (next $640K) → 4% (remainder)

### Additional Buyer's Stamp Duty (ABSD) — 2024 rates
| Profile | 1st | 2nd | 3rd+ |
|---|---|---|---|
| SC | 0% | 20% | 30% |
| PR | 5% | 30% | 35% |
| Foreigner | 60% | 60% | 60% |
| Entity | 65% | 65% | 65% |

### Seller's Stamp Duty (SSD)
| Hold period | Rate |
|---|---|
| ≤1 year | 12% |
| >1–2 years | 8% |
| >2–3 years | 4% |
| >3 years | 0% |

### Borrowing rules
- TDSR: max 55% of gross monthly income
- MSR: max 30% (HDB and EC only)
- LTV: 75% (1st loan), 45% (2nd), 35% (3rd+)
- Minimum cash down: 5% of purchase price

---

## 10. En-Bloc Scoring Model

Scores each development 0–100:

| Factor | Weight |
|---|---|
| Development age | 20% |
| Plot ratio headroom | 25% |
| Land size | 15% |
| Location / district | 15% |
| Previous CSC attempt | 10% |
| Ownership fragmentation | 10% |
| Lease remaining | 5% |

---

## 11. Phase Build Plan

### Phase 1 — Foundation (~1–2 weeks)
Project scaffold, investor profile form, tax calculator (BSD/ABSD/SSD/upfront cost), TDSR/MSR/LTV checks, `.env` config.  
**Deliverable:** Working tax calculator with profile-aware stamp duty rates.

### Phase 2 — Data Layer (~2 weeks)
URA transaction search page, comparable transactions, price trend charts (Recharts), Market Intelligence dashboard (data.gov.sg), SQLite cache, mock↔live data toggle.  
**Deliverable:** Browse real transaction data and market trends.

### Phase 3 — Analysis Tools (~2 weeks)
Loan comparison table (10 banks: DBS, OCBC, UOB, SCB, Citi, Maybank, HSBC, BOC, CIMB, RHB), SORA/fixed/board rate calculation, TDSR pass/fail, ROI cumulative return + IRR chart, scenario sensitivity, refinancing calculator.  
**Deliverable:** Compare bank loans and model full investment returns.

### Phase 4 — Visual Intelligence (~2 weeks)
Leaflet.js map + OneMap tiles, PSF choropleth heatmap (28 districts), MRT/school/mall layer toggles, district click popup, en-bloc scoring model, watch list with CSC status, historical pipeline table.  
**Deliverable:** Interactive Singapore property map with en-bloc intelligence.

### Phase 5 — AI & Advanced (~2 weeks)
Gemini 2.5 Flash chat interface, profile + market context injection, red flag detection, property shortlist (up to 10), side-by-side comparison table, AI verdict (Buy/Watch/Pass), per-property ROI + en-bloc score.  
**Deliverable:** Full AI-powered investment advisor with property comparison.

---

## 12. Out of Scope (v1)

- User authentication / multi-user accounts
- PropertyGuru / 99.co URL import
- PDF export of chat or reports
- Push notifications / price alerts (en-bloc)
- News feed aggregation (EdgeProp, Straits Times RSS)
- Mortgage rate scraping from bank websites (static seeded data used instead)
- Cloud deployment configuration

---

## Disclaimer

PropSage is an informational and decision-support tool. All calculations, projections, and AI-generated commentary are indicative only and do not constitute financial, legal, or investment advice. Users should consult a CEA-registered property agent, mortgage banker, and/or financial advisor before making any property investment decision.
