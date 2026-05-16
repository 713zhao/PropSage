import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProfilePage } from './pages/ProfilePage'
import { CalculatorPage } from './pages/CalculatorPage'

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
          <Route path="/map" element={<ComingSoon name="District Map" />} />
          <Route path="/transactions" element={<ComingSoon name="Transaction Search" />} />
          <Route path="/market" element={<ComingSoon name="Market Intelligence" />} />
          <Route path="/loans" element={<ComingSoon name="Loan Comparison" />} />
          <Route path="/roi" element={<ComingSoon name="ROI Projector" />} />
          <Route path="/enbloc" element={<ComingSoon name="En-Bloc Watch" />} />
          <Route path="/shortlist" element={<ComingSoon name="Property Shortlist" />} />
          <Route path="/advisor" element={<ComingSoon name="AI Advisor" />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
