import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { KosDetailRoutePage } from './pages/KosDetailRoutePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SearchResultsRoutePage } from './pages/SearchResultsRoutePage'
import { SearchRoutePage } from './pages/SearchRoutePage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { LegalPage } from './pages/LegalPage'
import { ActivityPage } from './pages/ActivityPage'
import { OwnerDashboardPage } from './pages/OwnerDashboardPage'

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [location.pathname, location.search])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchRoutePage />} />
        <Route path="/results" element={<SearchResultsRoutePage />} />
        <Route path="/kos/:kosId" element={<KosDetailRoutePage />} />
        <Route path="/login/:role" element={<LoginPage />} />
        <Route path="/register/:role" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/legal/:document" element={<LegalPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/owner" element={<OwnerDashboardPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
