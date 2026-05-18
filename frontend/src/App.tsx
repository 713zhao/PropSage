import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProfilePage } from './pages/ProfilePage'
import { CalculatorPage } from './pages/CalculatorPage'
import { MarketPage } from './pages/MarketPage'
import { TransactionPage } from './pages/TransactionPage'
import { LoanPage } from './pages/LoanPage'
import { ROIPage } from './pages/ROIPage'
import { EnblocPage } from './pages/EnblocPage'
import { MapPage } from './pages/MapPage'
import { ShortlistPage } from './pages/ShortlistPage'
import { AdvisorPage } from './pages/AdvisorPage'

function ComingSoon({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500 text-lg">{name} — coming in a later phase</p>
    </div>
  )
}

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
          <Route path="/market" element={<MarketPage />} />
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
