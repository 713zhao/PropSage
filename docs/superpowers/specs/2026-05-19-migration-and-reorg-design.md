# Design Spec: Migration and Reorganization of Property Intelligence Tools

## 1. Overview
Migrate and integrate core analytical pages from the `PropertyAnalysis` reference project into `PropSage`, with a unified navigation structure and multi-language support (EN/ZH).

## 2. Navigation & Information Architecture
The sidebar will be restructured as follows:

### Research Section
- **Market Dashboard**: Combined page of "Dashboard" and "Market Trends" from reference (Unified Scrolling view).
- **Land Intelligence**: Migrated from reference.
- **Macro Analysis**: Migrated from reference.
- **District Map**: Existing PropSage feature.
- **Transactions**: Existing PropSage feature.

### Analysis Section
- **Investment Strategy**: Migrated from reference.
- **Loan Compare**: Existing PropSage feature.
- **ROI Projector**: Existing PropSage feature.
- **En-Bloc Watch**: Existing PropSage feature.

## 3. Visual & UX Strategy
- **Styling**: All migrated pages will be refactored to use **Tailwind CSS** and PropSage's dark theme (Gray-950 background, Blue-400/500 accents).
- **Language Switcher**: A language toggle (EN/ZH) will be added to the top-right of the main content area (Header).
- **Language Management**: Implement `LanguageContext` following the reference project pattern to ensure compatibility with existing translation keys.

## 4. Technical Implementation
- **Dependencies**: Install `lucide-react` (if not present) and ensure `echarts` (or relevant charting lib) is configured.
- **Components**: Create a reusable `ChartCard` component in PropSage style.
- **Context**: Port `LanguageContext.tsx` and wrap the application.
- **API**: Ensure frontend components point to the correct backend endpoints (porting any necessary backend logic if required, though focusing on frontend migration first).

## 5. Scope of Work
1. Implementation of `LanguageContext` and translation files.
2. Refactoring and migration of:
    - `Dashboard` + `Market Trends` -> `MarketDashboard.tsx`
    - `Land Intelligence` -> `LandIntelligence.tsx`
    - `Macro Analysis` -> `MacroAnalysis.tsx`
    - `Investment Strategy` -> `InvestmentStrategy.tsx`
3. Updating `Sidebar.tsx` and routing in `App.tsx`.
4. Adding Header with Language Switcher.
