# PropSage — Data Sources

This document lists every page, every chart/table, where its data comes from, and how often it is refreshed.

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ Live | Fetched from a real external API at request time (or within the weekly cache window) |
| 🗄️ DB | Persisted in SQLite (`data/property_data.db`); seeded from real data but not auto-refreshed |
| ⚠️ Mock | Hardcoded/manually curated data bundled with the app |
| 🔢 Computed | Calculated from user inputs — no external data needed |
| 💾 Stored | Persisted in the browser's localStorage |

---

## Live Sync Architecture

Several pages use a **weekly cache** (`backend/data/macro_live_cache.json`) populated by calls to the **data.gov.sg CKAN API** (`data.gov.sg/api/action/datastore_search`). The cache is regenerated when:

- The cache file is missing or expired (TTL = 7 days), OR
- The user presses **"Force Sync Now"** on the Macro Analysis page (calls `/api/macro-live?refresh=true`)

The backend handles HTTP 429 rate-limit responses from data.gov.sg with exponential back-off (3 s → 6 s → 9 s, up to 3 retries per dataset). All data.gov.sg datasets used are public — no API key required.

---

## Page-by-Page Breakdown

---

### 1. Macro Analysis Page

All data flows through the `/api/macro-live` endpoint, which reads from the weekly cache or refreshes from data.gov.sg.

| Chart | Data Source | Status | Refresh |
|-------|-------------|--------|---------|
| **Private Property Price Index (PPI)** — CCR/RCR/OCR line chart | data.gov.sg CKAN — dataset `d_f65e490a8ad430f60a9a3d9df2bff2a0` (Private Residential PPI by market segment) | ✅ Live | Weekly auto-cache; manual "Force Sync" |
| **HDB Resale Price Index Trend** | SQLite `hdb_resale_index` table (145 rows seeded from data.gov.sg v1 API dataset `d_14f63e595975691e7c24a27ae4c07c79`). Falls back to CKAN API live call if table missing. | 🗄️ DB | Re-seed by running `scripts/fetch_data_gov.py` |
| **GLS Unsold Private Residential Supply** — total unsold units | data.gov.sg CKAN — dataset `d_84d05d45049108f0fd2e99b66bd19cfe` (private residential pipeline by market segment) | ✅ Live | Weekly auto-cache |
| **Developer Quarterly New Launches** — CCR/RCR/OCR stacked bar | data.gov.sg CKAN — three datasets: CCR `d_c287c8be114bfa7d055b27ab2c87de83`, RCR `d_5785799d63a9da091f4e0b456291eeb8`, OCR `d_1a7823f3d31e7db4b426833833762bab` (private residential units sold by type of sale) | ✅ Live | Weekly auto-cache |
| **URA Launch Pipeline** — horizontal bar (immediate / medium-term) | Same dataset as Unsold Supply above (`d_84d05d45049108f0fd2e99b66bd19cfe`), filtered to most recent quarter by launch/completion status | ✅ Live | Weekly auto-cache |
| **GDP Growth Rate** bar chart (with 1-quarter forecast) | data.gov.sg CKAN — dataset `d_579806298539b7ea57b855655b3d63b2`; falls back to hardcoded 2018–2025 values if API fails | ✅ Live (with fallback) | Weekly auto-cache |
| **Unemployment Rate** line chart (with 2-quarter forecast) | data.gov.sg CKAN — dataset `d_a1d4e3e9c7ea07c082729a674313f890`; falls back to hardcoded values if API fails | ✅ Live (with fallback) | Weekly auto-cache |
| **New Launches vs Unsold Inventory** — composite bar+line | Derived on the frontend from the above `launches` and `unsold` arrays already in `/api/macro-live`. No separate fetch. Total launches (CCR+RCR+OCR) used as supply proxy. Undersupply reference line at 15,000 units. | ✅ Live (derived) | Same as weekly cache |
| **Gross vs Net Rental Yield by Region** — bar chart | SQLite `rental_yields` table. Values sourced from URA Private Residential Rental Statistics (Q1 2026): CCR 3.0% / 1.8%, RCR 3.5% / 2.3%, OCR 4.2% / 3.0%. Net yield = gross minus ~1.2% (property tax, management fees, vacancy allowance). Served by `/api/market-reference`. | 🗄️ DB | Re-seed by running `scripts/populate_market_reference.py` (recommended: quarterly, after URA publishes rental statistics) |
| **Investment Scorecard by Region** — radar chart (CCR/RCR/OCR) | SQLite `location_scores` table with 6 investment axes scored 0–100. Scores based on: LTA MRT network coverage, MOE primary school catchment density, URA Master Plan 2025 transformation intensity, URA Realis transaction liquidity, and published yield data. Served by `/api/market-reference`. | 🗄️ DB | Update manually in `scripts/populate_market_reference.py` when URA Master Plan or MRT network changes significantly |
| **2-quarter forecast overlays** on PPI, HDB, Unsold, Launches, Unemployment | Linear regression extrapolation computed in Python at cache-generation time from the last 4–10 data points | 🔢 Computed | Regenerated with each cache refresh |

**Cache file location:** `backend/data/macro_live_cache.json`
**Cache TTL:** 7 days from last refresh
**To force refresh:** Click "Force Sync Now" in the UI, or call `GET /api/macro-live?refresh=true`

---

### 2. Market Dashboard

| Chart / Element | Data Source | Status | Refresh |
|-----------------|-------------|--------|---------|
| **Private vs Public Price Trend** (HDB + Private PPI, 10-year) | `/api/macro-insights` — queries SQLite `hdb_resale_index` (145 rows) and `private_property_index` (615 rows, All Residential filtered), joined by quarter. Also derives price gap and affordability index from `household_income` and `population_indicators` tables. | 🗄️ DB | Re-seed by running `scripts/fetch_data_gov.py` |
| **Unsold Inventory by Region** — stacked bar (CCR/RCR/OCR) | Derived from `/api/macro-live` launches data (same as Macro Analysis page above) | ✅ Live | Weekly auto-cache |
| **Private-Public Price Gap** | Computed from `macro-insights` data (private_index / hdb_index ratio) | 🔢 Computed | — |
| **Housing Affordability Index** | Computed from `macro-insights` (median_income / private_index) | 🔢 Computed | — |
| **Population vs Housing Stock** | `population_indicators` table (29 rows from data.gov.sg dataset `d_3d227e5d9fdec73f3bcadce671c333a6`) | 🗄️ DB | Re-seed via `scripts/fetch_data_gov.py` |
| **Recent Market Benchmarks** table | SQLite `new_launches` table — 18 real Singapore private residential projects (2021–2026) with unit counts, sales status, address and launch date. Ordered by year desc. | 🗄️ DB | Update manually in `scripts/populate_land_data.py` as new projects launch |
| **Top 20 Recent Transactions** table | `/api/transactions` — queries `hdb_transactions` table (231,000+ rows from data.gov.sg dataset `d_8b84c4ee58e3cfc0ece0d773c8ca6abc`) | 🗄️ DB | Re-seed via `scripts/fetch_data_gov.py` |

---

### 3. Land Intelligence Page

| Chart / Element | Data Source | Status | Refresh |
|-----------------|-------------|--------|---------|
| **Historical Land Cost Timeline** — scatter/line by region | SQLite `gls_residential` table (27 rows, 2018–2026) seeded from `scripts/populate_land_data.py` with real GLS awarded prices from SLA/BCA records | 🗄️ DB | Update `scripts/populate_land_data.py` when new GLS tenders are awarded |
| **Land Cost vs Launch Price Correlation** | SQLite `new_launches` table joined with `gls_residential` by year/region | 🗄️ DB | Same as above |
| **New Launch Price Benchmarks** table | SQLite `new_launches` table (18 projects, avg_price_psf and land_cost_psf_ppr) | 🗄️ DB | Update `scripts/populate_land_data.py` |

---

### 4. Transaction Page

| Element | Data Source | Status | Notes |
|---------|-------------|--------|-------|
| **Transaction search results** | `/api/transactions` — queries SQLite `hdb_transactions` (231,000+ rows) filtered by town, flat type, price range. Falls back to `ura_transactions` table if present (populated by URA DataService API). | 🗄️ DB | Re-seed HDB data via `scripts/fetch_data_gov.py`. For URA private transactions, set `URA_ACCESS_KEY` in `.env` and run `scripts/fetch_ura.py`. |

**Why not fully live?** The URA DataService API (`eservices.ura.gov.sg`) requires a registered access key and is rate-limited to 2 quarters per call. The HDB transaction dataset is large (231k rows) and best kept as a seeded DB table refreshed periodically rather than fetched per request.

---

### 5. Investment Strategy Page

| Element | Data Source | Status | Notes |
|---------|-------------|--------|-------|
| **Historical Price Trend (10 Years)** chart | For known demo projects (Sunshine Plaza, Kentish Green, Kentish Court): hardcoded KNOWLEDGE_BASE in `InvestmentStrategyPage.tsx`. For other projects: yearly average PSF computed from `hdb_transactions` transaction history, supplemented by `new_launches` table data. | ⚠️ Mock (demo) / 🗄️ DB (search) | Auto-loads on mount for the default project. |
| **Project search** (fetch button) | Same: KNOWLEDGE_BASE first, then `/api/transactions?project=NAME`, then `/api/launches-live` for supplementary benchmark | 🗄️ DB | — |
| **Financial modeling** (acquisition cost, TDSR, cashflow, IRR) | All calculated from user inputs using hardcoded IRAS/MAS rules | 🔢 Computed | — |
| **PSF Comparison** chart | Hardcoded comparison values per project (district freehold median, nearby competitor) | ⚠️ Mock | Update per project in component |
| **Location Score** bars (MRT, amenities, potential, health/green) | Hardcoded per district based on `getAmenitiesByTown()` heuristic in component | ⚠️ Mock | Update mapping logic when new MRT lines open |

---

### 6. Tax Calculator

| Element | Data Source | Status |
|---------|-------------|--------|
| BSD, ABSD, SSD amounts | Singapore IRAS rate tables hardcoded in `backend/app/services/tax.py` | ⚠️ Mock (rates correct as of Apr 2023 ABSD revision) |
| Upfront cost breakdown | Calculated from user inputs | 🔢 Computed |

**To make live:** No external API — update hardcoded rate tables when IRAS announces changes.

---

### 7. Profile & Affordability

| Element | Data Source | Status |
|---------|-------------|--------|
| Max affordable price | Calculated from income, TDSR (55%), LTV (75%), tenure | 🔢 Computed |
| ABSD / BSD preview | Calculated from citizenship + property count using hardcoded schedules | 🔢 Computed |

---

### 8. Loan Comparison & Refinancing

| Element | Data Source | Status | Notes |
|---------|-------------|--------|-------|
| 20 bank packages (10 banks × Fixed 2Y + SORA) | Hardcoded in `backend/app/services/loans.py` | ⚠️ Mock | Manually researched; update when bank rates change |
| 3-Month SORA rate | Hardcoded at **3.68%** in `_SORA_3M_PCT` | ⚠️ Mock | Current live 3M SORA is ~2.9–3.0% — this is stale |
| Monthly installment, TDSR, savings, break-even | Calculated from user inputs | 🔢 Computed | |

**To make live:** Scrape the MAS SORA daily fixing from `mas.gov.sg` or subscribe to a MAS data feed.

---

### 9. ROI Projector

| Element | Data Source | Status |
|---------|-------------|--------|
| Cumulative cashflow, IRR (Bear/Base/Bull) | Calculated from purchase price, rental, appreciation assumptions | 🔢 Computed |
| Sensitivity table | ±2% appreciation / ×0.9–1.1 rental applied to base inputs | 🔢 Computed |

---

### 10. En-Bloc Watch

| Element | Data Source | Status | Notes |
|---------|-------------|--------|-------|
| 12 developments list | Hardcoded in `backend/app/services/enbloc.py` | ⚠️ Mock | Real developments manually researched (Braddell View, Pearlbank, etc.) |
| En-bloc score | Computed from 7 weighted factors (age, plot ratio, land size, location, CSC history, ownership, lease) | 🔢 Computed | |
| CSC status | Hardcoded per development | ⚠️ Mock | No public API; sourced from SLA/STB notices at build time |

---

### 11. District Map

| Element | Data Source | Status | Notes |
|---------|-------------|--------|-------|
| Map tiles | OneMap Singapore (`onemap.gov.sg/maps/tiles/`) | ✅ Live | Requires `ONEMAP_TOKEN` in `.env` (expires every 3 days) |
| District PSF circles | Aggregated from SQLite `hdb_transactions` table; falls back to hardcoded estimates | 🗄️ DB | Accuracy improves with more transaction data |
| MRT stations (20 points) | Hardcoded in `backend/app/services/map_service.py` | ⚠️ Mock | Update when new MRT lines open |
| Schools (15 points) | Hardcoded | ⚠️ Mock | LTA/MOE datasets available on data.gov.sg |
| Shopping malls (15 points) | Hardcoded | ⚠️ Mock | — |

---

### 12. Property Shortlist

| Element | Data Source | Status |
|---------|-------------|--------|
| Saved properties | Browser localStorage via Zustand `persist` | 💾 Stored |
| Monthly installment, TDSR%, verdict | Calculated from price + profile (75% LTV, 3.5%, 25yr) | 🔢 Computed |

---

### 13. AI Advisor

| Element | Data Source | Status | Notes |
|---------|-------------|--------|-------|
| Chat replies | Google Gemini 2.5 Flash via `google-generativeai` SDK | ✅ Live | Requires `GEMINI_API_KEY` in `.env` |
| System context (profile + shortlist) | Injected from `profileStore` + `shortlistStore` at request time | 💾 Stored | |
| Red flag detection | Rule-based Python logic in `backend/app/services/advisor.py` | 🔢 Computed | Deterministic rules for ABSD, lease, TDSR |
| Chat history | In-memory Zustand (no persist) — resets on page reload | 🔢 Computed | By design |

---

## SQLite Database Tables

All tables live in `backend/data/property_data.db`.

| Table | Rows | Seeded By | Refresh Frequency |
|-------|------|-----------|-------------------|
| `hdb_resale_index` | 145 | `scripts/fetch_data_gov.py` | Quarterly (URA publishes quarterly) |
| `hdb_transactions` | 231,000+ | `scripts/fetch_data_gov.py` | Monthly (new resale data) |
| `private_property_index` | 615 | `scripts/fetch_data_gov.py` | Quarterly |
| `private_rental_index` | 515 | `scripts/fetch_data_gov.py` | Quarterly |
| `population_indicators` | 29 | `scripts/fetch_data_gov.py` | Annually |
| `household_income` | 24 | `scripts/fetch_data_gov.py` | Annually |
| `gls_residential` | 27 | `scripts/populate_land_data.py` | As new GLS tenders are awarded |
| `new_launches` | 18 | `scripts/populate_land_data.py` | As new projects launch (monthly/quarterly) |
| `rental_yields` | 3 | `scripts/populate_market_reference.py` | Quarterly (after URA rental stats release) |
| `location_scores` | 18 | `scripts/populate_market_reference.py` | When Master Plan or MRT network changes |

**To refresh all data.gov.sg tables:**
```powershell
cd backend; .venv\Scripts\python.exe scripts/fetch_data_gov.py
```

**To refresh land/launch tables:**
```powershell
cd backend; .venv\Scripts\python.exe scripts/populate_land_data.py
```

**To refresh rental yields and scorecard:**
```powershell
cd backend; .venv\Scripts\python.exe scripts/populate_market_reference.py
```

---

## Summary Table

| Page | ✅ Live | 🗄️ DB | ⚠️ Mock | 🔢 Computed |
|------|---------|--------|---------|-------------|
| Macro Analysis | PPI, Unsold, Launches, GDP, Unemployment, Pipeline | HDB index, Rental Yield, Scorecard | — | Forecasts |
| Market Dashboard | Unsold (via macro-live) | Price trend, Gap, Affordability, Benchmarks, Transactions | — | Gap, Affordability |
| Land Intelligence | — | GLS history, Launch benchmarks | — | Spread |
| Transaction Search | — | HDB + URA transactions | — | PSF |
| Investment Strategy | — | Transaction history | Demo project data | All financial outputs |
| Tax Calculator | — | — | IRAS rate tables | All amounts |
| Profile | — | — | MAS/IRAS rules | All outputs |
| Loan Comparison | — | — | Bank packages, SORA 3.68% | Installments, TDSR |
| ROI Projector | — | — | — | All outputs |
| En-Bloc Watch | — | — | 12 developments | Score |
| District Map | OneMap tiles | PSF per district | MRT/schools/malls | — |
| Shortlist | — | — | — | Verdict, installment |
| AI Advisor | Gemini 2.5 Flash | — | — | Red flags |

---

## What Would Make Everything Fully Live

| Data | Source | Effort |
|------|--------|--------|
| URA private transaction history | URA DataService (`eservices.ura.gov.sg`) — key configured, needs network access + `scripts/fetch_ura.py` | Low |
| Live SORA rate | MAS website or MAS data API — update `_SORA_3M_PCT` in `loans.py` | Medium |
| Bank spreads | No public API — manual update or bank website scraper | High |
| Rental yield (computed, not stored) | Compute from `private_rental_index` / `private_property_index` ratio in DB — eliminates manual update | Medium |
| MRT/School/Mall points | data.gov.sg has LTA MRT dataset (`d_64b87e49a8ee1e78d1fd76e63e0e3e9f`) and MOE school dataset | Medium |
| En-bloc CSC status | No public API — SLA/STB notices scraping | High |
| Live ABSD/BSD rates | No API — update `services/tax.py` when IRAS announces changes | Low (manual) |
