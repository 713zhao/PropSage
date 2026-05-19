# Migration and Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate analytical pages from `PropertyAnalysis` into `PropSage`, reorganize navigation into Research/Analysis sections, and add multi-language support (EN/ZH).

**Architecture:**
- `LanguageContext` (Context API) for localization management.
- `AppShell` update with a `Header` containing a language toggle.
- `Sidebar` restructure using `lucide-react` icons.
- New `MarketDashboard` merging "Dashboard" and "Market Trends".
- Ported pages: `Land Intelligence`, `Macro Analysis`, `Investment Strategy`.
- **Backend Strategy**: Migrated pages will point to the existing reference backend at `https://prop-intel-backend-713.fly.dev`.
- Styled with Tailwind CSS to match PropSage's dark theme.

**Tech Stack:** React, Tailwind CSS, Lucide React, ECharts, Context API.

---

### Task 1: Setup Frontend Dependencies and Localization

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/context/LanguageContext.tsx`
- Create: `frontend/src/locales/en.json`
- Create: `frontend/src/locales/zh.json`
- Create: `frontend/src/config/analysisApi.ts`

- [ ] **Step 1: Install dependencies**
Run: `npm install lucide-react echarts echarts-for-react` (in `frontend` directory)

- [ ] **Step 2: Create LanguageContext.tsx**
```tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import en from '../locales/en.json'
import zh from '../locales/zh.json'

type Language = 'en' | 'zh'
type Translations = typeof en

const translations: Record<Language, Translations> = { en, zh }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'zh'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key: string) => {
    return (translations[language] as any)[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
```

- [ ] **Step 3: Create translation files**
Populate `en.json` and `zh.json` with keys from `LanguageContext.tsx` in the reference project.

- [ ] **Step 4: Create analysisApi.ts**
```ts
export const ANALYSIS_API_URL = 'https://prop-intel-backend-713.fly.dev';
```

- [ ] **Step 5: Wrap App with LanguageProvider**
Modify `frontend/src/main.tsx` to include `LanguageProvider`.

- [ ] **Step 6: Commit**
```bash
git add frontend/package.json frontend/src/context/LanguageContext.tsx frontend/src/locales/ frontend/src/main.tsx frontend/src/config/analysisApi.ts
git commit -m "feat: add localization context, dependencies, and analysis API config"
```

### Task 2: Create Header and Update Layout

**Files:**
- Create: `frontend/src/components/layout/Header.tsx`
- Modify: `frontend/src/components/layout/AppShell.tsx`

- [ ] **Step 1: Create Header component**
Implement a simple header with a language switcher (EN/ZH).
```tsx
import { useLanguage } from '../../context/LanguageContext'

export function Header() {
  const { language, setLanguage } = useLanguage()

  return (
    <header className="h-14 border-b border-gray-800 flex items-center justify-end px-6 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs font-medium">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded ${language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('zh')}
          className={`px-3 py-1 rounded ${language === 'zh' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          中文
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Update AppShell**
Include the Header above the main content area.
```tsx
import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/layout/
git commit -m "feat: add header with language switcher"
```

### Task 3: Restructure Sidebar and Routing

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Update Sidebar sections**
Reorganize `NAV_SECTIONS` according to the design spec.
```tsx
import { BarChart3, Map, Building2, LineChart, ClipboardList, Lightbulb, Landmark, TrendingUp, Home, Calculator, User, Pin, Bot } from 'lucide-react'
// ... update NAV_SECTIONS with icons and new paths
```

- [ ] **Step 2: Update App routes**
Add paths for: `/market`, `/land-intel`, `/macro`, `/investment`.
Keep existing paths.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/layout/Sidebar.tsx frontend/src/App.tsx
git commit -m "feat: restructure sidebar and app routes"
```

### Task 4: Implement Market Dashboard (Unified)

**Files:**
- Create: `frontend/src/pages/MarketDashboard.tsx`
- Create: `frontend/src/components/dashboard/ChartCard.tsx`

- [ ] **Step 1: Create styled ChartCard**
Refactor reference `ChartCard` to use Tailwind.

- [ ] **Step 2: Implement MarketDashboard**
Combine `Dashboard` and `MarketTrends` using `ANALYSIS_API_URL`.
Refactor styles to Tailwind.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/pages/MarketDashboard.tsx frontend/src/components/dashboard/ChartCard.tsx
git commit -m "feat: implement unified Market Dashboard"
```

### Task 5: Port Analytical Pages (Land Intel, Macro, Investment)

**Files:**
- Create: `frontend/src/pages/LandIntelligencePage.tsx`
- Create: `frontend/src/pages/MacroAnalysisPage.tsx`
- Create: `frontend/src/pages/InvestmentStrategyPage.tsx`

- [ ] **Step 1: Port Land Intelligence**
Refactor to Tailwind, use `ANALYSIS_API_URL`.

- [ ] **Step 2: Port Macro Analysis**
Refactor to Tailwind, use `ANALYSIS_API_URL`.

- [ ] **Step 3: Port Investment Strategy**
Refactor to Tailwind, use `ANALYSIS_API_URL`.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/pages/
git commit -m "feat: port analytical pages using reference backend"
```

### Task 6: Final Polish and Verification

- [ ] **Step 1: Verify all pages**
Check multi-language switching on all migrated pages.

- [ ] **Step 2: Final Commit**
```bash
git commit -m "chore: final polish and verification"
```
