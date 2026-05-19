import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProfilePage } from './pages/ProfilePage'
import { CalculatorPage } from './pages/CalculatorPage'
import { MarketDashboard } from './pages/MarketDashboard'
import { TransactionPage } from './pages/TransactionPage'
import { LoanPage } from './pages/LoanPage'
import { ROIPage } from './pages/ROIPage'
import { EnblocPage } from './pages/EnblocPage'
import { MapPage } from './pages/MapPage'
import { ShortlistPage } from './pages/ShortlistPage'
import { AdvisorPage } from './pages/AdvisorPage'
import { LandIntelligencePage } from './pages/LandIntelligencePage'
import { MacroAnalysisPage } from './pages/MacroAnalysisPage'
import { InvestmentStrategyPage } from './pages/InvestmentStrategyPage'

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/calculator" replace />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/transactions" element={<TransactionPage />} />
          <Route path="/market" element={<MarketDashboard />} />
          <Route path="/land-intel" element={<LandIntelligencePage />} />
          <Route path="/macro" element={<MacroAnalysisPage />} />
          <Route path="/investment" element={<InvestmentStrategyPage />} />
          <Route path="/loans" element={<LoanPage />} />
          <Route path="/roi" element={<ROIPage />} />
          <Route path="/enbloc" element={<EnblocPage />} />
          <Route path="/shortlist" element={<ShortlistPage />} />
          <Route path="/advisor" element={<AdvisorPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
