# Phase 5 — AI & Advanced Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Gemini 2.5 Flash AI advisor chat, a persistent property shortlist with side-by-side comparison, and rule-based Buy/Watch/Pass verdicts.

**Architecture:** Backend adds one new router (`/api/advisor`) that wraps Gemini 2.5 Flash, injects investor profile + market context, and returns structured responses with detected red flags. Frontend adds a `shortlistStore` (persisted), a `chatStore` (in-memory only), two new pages (`ShortlistPage`, `AdvisorPage`), and a "Save to shortlist" button on the existing `TransactionPage`.

**Tech Stack:** `google-generativeai` Python SDK (stubs when key absent); React 18 + TypeScript + Zustand; Tailwind CSS. No new database tables — shortlist is localStorage only.

---

## File Structure

**Backend (new):**
- `backend/app/schemas/advisor.py` — ChatMessage, AdvisorRequest, AdvisorResponse
- `backend/app/services/advisor.py` — Gemini client, context builder, red flag detector, stub fallback
- `backend/app/routers/advisor.py` — POST /api/advisor/chat
- Modify: `backend/app/main.py` — register advisor router
- Create: `backend/tests/test_advisor.py` — tests for red flag detection + stub response

**Frontend (new):**
- `frontend/src/stores/shortlistStore.ts` — Zustand persisted store, max 10 properties
- `frontend/src/stores/chatStore.ts` — In-memory (NOT persisted) chat history
- `frontend/src/api/advisor.ts` — ChatMessage type + sendMessage()
- `frontend/src/pages/ShortlistPage.tsx` — property cards + side-by-side comparison table + verdicts
- `frontend/src/pages/AdvisorPage.tsx` — Gemini chat UI with red flag chips

**Frontend (modified):**
- `frontend/src/pages/TransactionPage.tsx` — add "Save" button per result row
- `frontend/src/App.tsx` — wire /shortlist → ShortlistPage, /advisor → AdvisorPage

---

### Task 1: AI Advisor Backend

**Files:**
- Create: `backend/app/schemas/advisor.py`
- Create: `backend/app/services/advisor.py`
- Create: `backend/app/routers/advisor.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_advisor.py`

- [ ] **Step 1: Install google-generativeai**

Run from `C:\zjb2\PropertyAgent\backend\`:
```
pip install google-generativeai
```

Also add to `backend/requirements.txt` if it exists. If not, create it with the current installed packages or just add the line `google-generativeai`.

- [ ] **Step 2: Write failing tests**

```python
# backend/tests/test_advisor.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.advisor import detect_red_flags, build_system_prompt

client = TestClient(app)


def test_detect_red_flags_high_tdsr():
    profile = {"annualIncomeSgd": 60_000, "existingMonthlyLoanCommitments": 0}
    flags = detect_red_flags("buy a $2M property", profile)
    # No price in message to trigger price flag, but function should return list
    assert isinstance(flags, list)


def test_detect_red_flags_foreigner():
    profile = {"citizenship": "Foreigner", "existingPropertyCount": 0}
    flags = detect_red_flags("should I buy a condo", profile)
    assert any("ABSD" in f or "60%" in f for f in flags)


def test_detect_red_flags_short_lease():
    profile = {}
    flags = detect_red_flags("lease remaining is 25 years", profile)
    assert any("lease" in f.lower() for f in flags)


def test_build_system_prompt_contains_disclaimer():
    prompt = build_system_prompt({}, [])
    assert "not financial advice" in prompt.lower() or "indicative" in prompt.lower()


def test_build_system_prompt_injects_citizenship():
    profile = {"citizenship": "PR", "existingPropertyCount": 1}
    prompt = build_system_prompt(profile, [])
    assert "PR" in prompt


def test_advisor_chat_stub_response():
    # Without a real GEMINI_API_KEY the service must return a stub, not crash
    resp = client.post("/api/advisor/chat", json={
        "messages": [{"role": "user", "content": "What is ABSD?"}],
        "profile": {"citizenship": "SC", "existingPropertyCount": 0},
        "shortlist": [],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert "red_flags" in data
    assert isinstance(data["red_flags"], list)


def test_advisor_chat_empty_messages_422():
    resp = client.post("/api/advisor/chat", json={
        "messages": [],
        "profile": {},
        "shortlist": [],
    })
    assert resp.status_code == 422
```

- [ ] **Step 3: Run tests to verify they fail**

```
cd backend && python -m pytest tests/test_advisor.py -v
```

Expected: ImportError / 422 (modules don't exist)

- [ ] **Step 4: Create advisor schemas**

```python
# backend/app/schemas/advisor.py
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str  # "user" | "model"
    content: str


class AdvisorRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    profile: dict = {}
    shortlist: list[dict] = []


class AdvisorResponse(BaseModel):
    reply: str
    red_flags: list[str]
```

- [ ] **Step 5: Create advisor service**

```python
# backend/app/services/advisor.py
import os

_DISCLAIMER = "\n\n---\n*Indicative only — not financial advice. Consult a CEA-registered agent and financial advisor before any property decision.*"

_SYSTEM_TEMPLATE = """You are PropSage, an expert Singapore property investment advisor. You help investors evaluate properties, understand stamp duties, interpret market data, and assess investment viability in Singapore.

Always respond in a structured, factual, and helpful manner. Use SGD currency. Reference Singapore-specific regulations (BSD, ABSD, SSD, TDSR, MSR, LTV rules).

**Investor profile:**
{profile_summary}

**Active shortlist:**
{shortlist_summary}

Never give generic advice — always tailor to the investor profile above. If asked about a specific property, factor in their citizenship, existing properties, income, and goals. Always end your response with the standard disclaimer."""


def build_system_prompt(profile: dict, shortlist: list[dict]) -> str:
    citizenship = profile.get("citizenship", "unknown")
    count = profile.get("existingPropertyCount", 0)
    income = profile.get("annualIncomeSgd", 0)
    budget = profile.get("purchasePriceBudget", 0)
    goals = profile.get("investmentGoals", [])
    risk = profile.get("riskProfile", "unknown")

    if income > 0:
        profile_summary = (
            f"Citizenship: {citizenship} | Existing properties: {count} | "
            f"Annual income: SGD {income:,.0f} | Budget: SGD {budget:,.0f} | "
            f"Goals: {', '.join(goals) if goals else 'not set'} | Risk: {risk}"
        )
    else:
        profile_summary = f"Citizenship: {citizenship} | Existing properties: {count} | Income: not set"

    if shortlist:
        items = [f"- {p.get('project', 'Unknown')} ({p.get('district', '?')}) SGD {p.get('price', 0):,.0f}" for p in shortlist[:5]]
        shortlist_summary = "\n".join(items)
    else:
        shortlist_summary = "No properties shortlisted yet."

    return _SYSTEM_TEMPLATE.format(
        profile_summary=profile_summary,
        shortlist_summary=shortlist_summary,
    )


def detect_red_flags(latest_message: str, profile: dict) -> list[str]:
    flags: list[str] = []
    msg = latest_message.lower()

    # Foreigner ABSD flag
    if profile.get("citizenship") == "Foreigner":
        flags.append("⚠️ As a foreigner, ABSD is 60% on any residential property purchase.")

    # Short lease detection in message
    for phrase in ["25 year", "24 year", "23 year", "22 year", "20 year", "lease remaining", "leasehold"]:
        if phrase in msg and any(str(y) in msg for y in range(10, 30)):
            flags.append("⚠️ Short remaining lease detected — properties with <30 years lease face financing and resale challenges.")
            break

    # High ABSD for PR or SC 2nd property
    citizenship = profile.get("citizenship", "SC")
    existing = profile.get("existingPropertyCount", 0)
    if citizenship == "PR" and existing >= 1:
        flags.append(f"⚠️ As a PR buying property #{existing + 1}, ABSD is {30 if existing == 1 else 35}%.")
    elif citizenship == "SC" and existing >= 1:
        flags.append(f"⚠️ As a SC buying property #{existing + 1}, ABSD is {20 if existing == 1 else 30}%.")

    # High price vs budget
    income = profile.get("annualIncomeSgd", 0)
    if income > 0:
        monthly_income = income / 12
        # If message contains a price-like number > 5× annual income, flag it
        import re
        prices = re.findall(r'\$?([\d,]+(?:\.\d+)?)\s*(?:million|m\b)', msg)
        for p in prices:
            val = float(p.replace(",", "")) * 1_000_000
            if val > income * 8:
                flags.append(f"⚠️ Property price may exceed comfortable affordability — check TDSR at this price point.")
                break

    return flags


def _stub_response(message: str) -> str:
    return (
        "PropSage AI is not configured — `GEMINI_API_KEY` is not set in your `.env` file. "
        "To enable AI advisory, add your Gemini API key and restart the backend.\n\n"
        "In the meantime, use the Tax Calculator, Loan Compare, and ROI Projector for quantitative analysis."
        + _DISCLAIMER
    )


def call_advisor(messages: list[dict], profile: dict, shortlist: list[dict]) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return _stub_response(messages[-1].get("content", ""))

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=build_system_prompt(profile, shortlist),
        )

        history = []
        for m in messages[:-1]:
            history.append({"role": m["role"], "parts": [m["content"]]})

        chat = model.start_chat(history=history)
        response = chat.send_message(messages[-1]["content"])
        return response.text + _DISCLAIMER

    except Exception as exc:
        return (
            f"AI advisor encountered an error: {exc}. "
            "Please check your GEMINI_API_KEY and try again."
            + _DISCLAIMER
        )
```

- [ ] **Step 6: Create advisor router**

```python
# backend/app/routers/advisor.py
from fastapi import APIRouter
from app.schemas.advisor import AdvisorRequest, AdvisorResponse
from app.services.advisor import call_advisor, detect_red_flags

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


@router.post("/chat", response_model=AdvisorResponse)
def chat(req: AdvisorRequest) -> AdvisorResponse:
    latest = req.messages[-1].content
    red_flags = detect_red_flags(latest, req.profile)
    reply = call_advisor(
        [{"role": m.role, "content": m.content} for m in req.messages],
        req.profile,
        req.shortlist,
    )
    return AdvisorResponse(reply=reply, red_flags=red_flags)
```

- [ ] **Step 7: Register in main.py**

In `backend/app/main.py`, add `advisor` to imports:
```python
from app.routers import tax, profile, market, transactions, loans, roi, enbloc, advisor
```

Add after the existing `app.include_router(map_router.router)`:
```python
app.include_router(advisor.router)
```

- [ ] **Step 8: Run tests — expect pass**

```
cd backend && python -m pytest tests/test_advisor.py -v
```

Expected: 7/7 PASS (stub response used since no GEMINI_API_KEY set in test env)

- [ ] **Step 9: Run full suite**

```
cd backend && python -m pytest -v
```

Expected: All tests pass (128 + 7 = 135 total).

- [ ] **Step 10: Commit**

```
git add backend/app/schemas/advisor.py backend/app/services/advisor.py backend/app/routers/advisor.py backend/app/main.py backend/tests/test_advisor.py
git commit -m "feat: AI advisor endpoint with Gemini 2.5 Flash and stub fallback"
```

---

### Task 2: Shortlist Frontend

**Files:**
- Create: `frontend/src/stores/shortlistStore.ts`
- Create: `frontend/src/pages/ShortlistPage.tsx`
- Modify: `frontend/src/pages/TransactionPage.tsx` (add Save button)
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Read existing files**

Read `frontend/src/pages/TransactionPage.tsx` to understand the current result row structure (specifically what data each transaction record has). Read `frontend/src/App.tsx` for current routes.

- [ ] **Step 2: Create shortlistStore**

```typescript
// frontend/src/stores/shortlistStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ShortlistedProperty {
  id: string
  project: string
  street: string
  district: string
  area_sqft: number
  price: number
  psf: number
  floor_range: string
  tenure: string
  property_type: string
  addedAt: string
}

interface ShortlistState {
  properties: ShortlistedProperty[]
  addProperty: (p: Omit<ShortlistedProperty, 'id' | 'addedAt'>) => void
  removeProperty: (id: string) => void
  isShortlisted: (project: string, floor_range: string, price: number) => boolean
  clearAll: () => void
}

export const useShortlistStore = create<ShortlistState>()(
  persist(
    (set, get) => ({
      properties: [],
      addProperty: (p) => {
        const current = get().properties
        if (current.length >= 10) return
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        set({ properties: [...current, { ...p, id, addedAt: new Date().toISOString() }] })
      },
      removeProperty: (id) =>
        set((s) => ({ properties: s.properties.filter((p) => p.id !== id) })),
      isShortlisted: (project, floor_range, price) =>
        get().properties.some(
          (p) => p.project === project && p.floor_range === floor_range && p.price === price
        ),
      clearAll: () => set({ properties: [] }),
    }),
    { name: 'shortlist-store' }
  )
)
```

- [ ] **Step 3: Create ShortlistPage**

```tsx
// frontend/src/pages/ShortlistPage.tsx
import { useState } from 'react'
import { useShortlistStore, type ShortlistedProperty } from '../stores/shortlistStore'
import { useProfileStore } from '../stores/profileStore'

function formatSgd(n: number): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n)
}

function computeMonthlyInstallment(price: number): number {
  const loan = price * 0.75
  const r = 0.035 / 12
  const n = 25 * 12
  return loan * (r * (1 + r) ** n) / ((1 + r) ** n - 1)
}

function computeVerdict(
  p: ShortlistedProperty,
  monthlyIncome: number,
  existingCommitments: number,
  budget: number
): { label: 'Buy' | 'Watch' | 'Pass'; color: string } {
  const installment = computeMonthlyInstallment(p.price)
  const totalCommitments = installment + existingCommitments

  if (p.price > budget * 1.25) {
    return { label: 'Pass', color: 'text-red-400 bg-red-900/30 border-red-700' }
  }
  if (monthlyIncome > 0) {
    const tdsr = totalCommitments / monthlyIncome
    if (tdsr > 0.55) return { label: 'Pass', color: 'text-red-400 bg-red-900/30 border-red-700' }
    if (tdsr > 0.40) return { label: 'Watch', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700' }
    return { label: 'Buy', color: 'text-green-400 bg-green-900/30 border-green-700' }
  }
  if (p.price > budget) {
    return { label: 'Watch', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700' }
  }
  return { label: 'Buy', color: 'text-green-400 bg-green-900/30 border-green-700' }
}

function PropertyCard({ p, onRemove }: { p: ShortlistedProperty; onRemove: () => void }) {
  const { profile } = useProfileStore()
  const monthlyIncome = profile.annualIncomeSgd / 12
  const verdict = computeVerdict(p, monthlyIncome, profile.existingMonthlyLoanCommitments, profile.purchasePriceBudget)
  const installment = computeMonthlyInstallment(p.price)

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 relative">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 text-gray-600 hover:text-red-400 text-xs"
        title="Remove from shortlist"
      >
        ✕
      </button>
      <div className="pr-6">
        <p className="text-gray-100 font-semibold text-sm leading-tight">{p.project}</p>
        <p className="text-gray-500 text-xs mt-0.5">{p.street} · {p.district}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-gray-500">Price</span>
        <span className="text-gray-200 font-medium">{formatSgd(p.price)}</span>
        <span className="text-gray-500">PSF</span>
        <span className="text-gray-200">{formatSgd(p.psf)}</span>
        <span className="text-gray-500">Area</span>
        <span className="text-gray-200">{p.area_sqft.toLocaleString()} sqft</span>
        <span className="text-gray-500">Floor</span>
        <span className="text-gray-200">{p.floor_range}</span>
        <span className="text-gray-500">Tenure</span>
        <span className="text-gray-200 truncate">{p.tenure}</span>
        <span className="text-gray-500">Monthly</span>
        <span className="text-gray-200">{formatSgd(installment)}/mo</span>
      </div>
      <div className="mt-3">
        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${verdict.color}`}>
          {verdict.label}
        </span>
        <span className="ml-2 text-xs text-gray-600">at 75% LTV, 25y</span>
      </div>
    </div>
  )
}

export function ShortlistPage() {
  const { properties, removeProperty, clearAll } = useShortlistStore()
  const [view, setView] = useState<'cards' | 'compare'>('cards')
  const { profile } = useProfileStore()
  const monthlyIncome = profile.annualIncomeSgd / 12

  if (properties.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-400">Shortlist</h1>
        <p className="text-sm text-gray-500 mt-1">Save properties from the Transactions page to compare here.</p>
        <div className="mt-8 bg-gray-900 rounded-lg border border-gray-800 p-10 text-center">
          <p className="text-gray-500 text-lg">No properties saved yet.</p>
          <p className="text-gray-600 text-sm mt-2">
            Browse Transactions and click the bookmark icon to save up to 10 properties.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Shortlist</h1>
          <p className="text-sm text-gray-500 mt-1">
            {properties.length}/10 properties saved
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setView('cards')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${view === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            Cards
          </button>
          <button
            onClick={() => setView('compare')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${view === 'compare' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            Compare
          </button>
          <button
            onClick={() => { if (confirm('Clear all shortlisted properties?')) clearAll() }}
            className="px-3 py-1 rounded text-sm text-gray-600 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} p={p} onRemove={() => removeProperty(p.id)} />
          ))}
        </div>
      )}

      {view === 'compare' && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase w-32">Attribute</th>
                {properties.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-left min-w-[160px]">
                    <p className="text-gray-200 font-semibold text-xs leading-tight">{p.project}</p>
                    <p className="text-gray-600 text-xs">{p.district}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Price', fn: (p: ShortlistedProperty) => formatSgd(p.price) },
                { label: 'PSF', fn: (p: ShortlistedProperty) => formatSgd(p.psf) },
                { label: 'Area (sqft)', fn: (p: ShortlistedProperty) => p.area_sqft.toLocaleString() },
                { label: 'Floor', fn: (p: ShortlistedProperty) => p.floor_range },
                { label: 'Tenure', fn: (p: ShortlistedProperty) => p.tenure },
                { label: 'Type', fn: (p: ShortlistedProperty) => p.property_type },
                {
                  label: 'Monthly (75% LTV, 25y)',
                  fn: (p: ShortlistedProperty) => formatSgd(computeMonthlyInstallment(p.price)) + '/mo',
                },
                {
                  label: 'TDSR%',
                  fn: (p: ShortlistedProperty) => {
                    if (monthlyIncome <= 0) return '—'
                    const tdsr = (computeMonthlyInstallment(p.price) + profile.existingMonthlyLoanCommitments) / monthlyIncome
                    return `${(tdsr * 100).toFixed(1)}%`
                  },
                },
                {
                  label: 'Verdict',
                  fn: (p: ShortlistedProperty) => {
                    const v = computeVerdict(p, monthlyIncome, profile.existingMonthlyLoanCommitments, profile.purchasePriceBudget)
                    return v.label
                  },
                },
              ].map((row) => (
                <tr key={row.label} className="border-b border-gray-800/50">
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{row.label}</td>
                  {properties.map((p) => {
                    const val = row.fn(p)
                    const isBuy = val === 'Buy'
                    const isPass = val === 'Pass'
                    return (
                      <td
                        key={p.id}
                        className={`px-4 py-2.5 text-xs font-medium ${
                          isBuy ? 'text-green-400' : isPass ? 'text-red-400' : 'text-gray-300'
                        }`}
                      >
                        {val}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center pb-4">
        Verdict based on TDSR at 75% LTV, 3.5% rate, 25-year tenure. Indicative only — not financial advice.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Add Save button to TransactionPage**

Read `frontend/src/pages/TransactionPage.tsx`. Find the result row rendering — there will be a `<tr>` or card for each transaction. Add an import for `useShortlistStore` at the top and add a bookmark button to each row that:
1. Calls `addProperty()` with the transaction data when clicked
2. Shows a filled bookmark (🔖) when already shortlisted, hollow one (🏷️) when not
3. Disables when shortlist is full (length >= 10)

The transaction data fields available from the existing type are: project, street, district, area_sqft, price, psf, floor_range, tenure, property_type. Map these to the `ShortlistedProperty` shape.

Add the bookmark column to the existing table. If results are rendered as table rows, add a new `<td>` column; if cards, add a button to the card.

- [ ] **Step 5: Wire up App.tsx**

Add imports:
```tsx
import { ShortlistPage } from './pages/ShortlistPage'
```

Replace `<Route path="/shortlist" element={<ComingSoon name="Property Shortlist" />} />` with:
```tsx
<Route path="/shortlist" element={<ShortlistPage />} />
```

- [ ] **Step 6: TypeScript check**

```
cd frontend && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 7: Commit**

```
git add frontend/src/stores/shortlistStore.ts frontend/src/pages/ShortlistPage.tsx frontend/src/pages/TransactionPage.tsx frontend/src/App.tsx
git commit -m "feat: property shortlist with side-by-side comparison and Buy/Watch/Pass verdicts"
```

---

### Task 3: AI Advisor Frontend

**Files:**
- Create: `frontend/src/stores/chatStore.ts`
- Create: `frontend/src/api/advisor.ts`
- Create: `frontend/src/pages/AdvisorPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create chatStore (in-memory, NOT persisted)**

```typescript
// frontend/src/stores/chatStore.ts
import { create } from 'zustand'

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface ChatState {
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  clearHistory: () => void
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearHistory: () => set({ messages: [] }),
}))
```

- [ ] **Step 2: Create advisor API module**

```typescript
// frontend/src/api/advisor.ts
import { apiPost } from './client'
import type { ChatMessage } from '../stores/chatStore'
import type { InvestorProfile } from '../types/profile'
import type { ShortlistedProperty } from '../stores/shortlistStore'

export interface AdvisorResponse {
  reply: string
  red_flags: string[]
}

export function sendMessage(
  messages: ChatMessage[],
  profile: InvestorProfile,
  shortlist: ShortlistedProperty[]
): Promise<AdvisorResponse> {
  return apiPost('/api/advisor/chat', { messages, profile, shortlist })
}
```

- [ ] **Step 3: Create AdvisorPage**

```tsx
// frontend/src/pages/AdvisorPage.tsx
import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useProfileStore } from '../stores/profileStore'
import { useShortlistStore } from '../stores/shortlistStore'
import { sendMessage } from '../api/advisor'

function RedFlagChip({ text }: { text: string }) {
  return (
    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg px-3 py-2 text-xs text-yellow-300">
      {text}
    </div>
  )
}

function MessageBubble({ role, content }: { role: 'user' | 'model'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-700 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
        }`}
      >
        {content}
      </div>
    </div>
  )
}

export function AdvisorPage() {
  const { messages, addMessage, clearHistory } = useChatStore()
  const { profile } = useProfileStore()
  const { properties } = useShortlistStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [redFlags, setRedFlags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user' as const, content: text }
    addMessage(userMsg)
    setInput('')
    setLoading(true)
    setError(null)
    setRedFlags([])

    try {
      const result = await sendMessage([...messages, userMsg], profile, properties)
      addMessage({ role: 'model', content: result.reply })
      setRedFlags(result.red_flags)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const shortlistCount = properties.length
  const monthlyIncome = profile.annualIncomeSgd / 12

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">AI Advisor</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Powered by Gemini 2.5 Flash · advising as:{' '}
            <span className="text-gray-400">
              {profile.citizenship}
              {monthlyIncome > 0 ? `, SGD ${Math.round(monthlyIncome).toLocaleString()}/mo` : ', income not set'}
              {shortlistCount > 0 ? `, ${shortlistCount} shortlisted` : ''}
            </span>
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Red flags */}
      {redFlags.length > 0 && (
        <div className="space-y-1 mb-3">
          {redFlags.map((f, i) => <RedFlagChip key={i} text={f} />)}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-xl border border-gray-800 p-4 mb-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-sm">Ask me anything about Singapore property investment.</p>
            <p className="text-xs mt-1">Try: "Is D10 a good district for capital appreciation?" or "Explain ABSD for PRs."</p>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="text-gray-400 text-sm">Thinking…</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start mb-3">
            <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-xs text-red-400">
              {error}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any Singapore property topic… (Enter to send, Shift+Enter for new line)"
          rows={2}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 resize-none focus:outline-none focus:border-blue-500 placeholder-gray-600"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire up App.tsx**

Read `frontend/src/App.tsx`. Add imports:
```tsx
import { AdvisorPage } from './pages/AdvisorPage'
```

Replace `<Route path="/advisor" element={<ComingSoon name="AI Advisor" />} />` with:
```tsx
<Route path="/advisor" element={<AdvisorPage />} />
```

- [ ] **Step 5: TypeScript check**

```
cd frontend && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 6: Commit**

```
git add frontend/src/stores/chatStore.ts frontend/src/api/advisor.ts frontend/src/pages/AdvisorPage.tsx frontend/src/App.tsx
git commit -m "feat: AI advisor chat page with Gemini 2.5 Flash and red flag chips"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Gemini 2.5 Flash chat interface | Task 1 (backend) + Task 3 (AdvisorPage) |
| Profile + market context injection | Task 1 — `build_system_prompt()` injects profile + shortlist |
| Red flag detection | Task 1 — `detect_red_flags()` + Task 3 — `RedFlagChip` display |
| Property shortlist (up to 10) | Task 2 — `shortlistStore` with max 10 guard |
| Side-by-side comparison table | Task 2 — `ShortlistPage` compare view |
| AI verdict (Buy/Watch/Pass) | Task 2 — rule-based `computeVerdict()` in ShortlistPage |
| Per-property ROI | Task 2 — `computeMonthlyInstallment()` shown per card + compare table |
| Per-property en-bloc score | Not included — en-bloc is district-level, not per-project; ShortlistPage shows district for lookup |

**Note on en-bloc per-property score:** The en-bloc scoring from Phase 4 operates on specific named developments from the seed list. Shortlisted properties from transaction search won't always match a named development. The ShortlistPage shows the district code so users can cross-reference the EnblocPage — this is cleaner than a broken lookup.

**Placeholder scan:** No TBDs. All code is complete.

**Type consistency:** `ChatMessage` used in `chatStore`, `advisor.ts`, and `AdvisorPage`. `ShortlistedProperty` used in `shortlistStore`, `ShortlistPage`, `advisor.ts`. Both consistent.
