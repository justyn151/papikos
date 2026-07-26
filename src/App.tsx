import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnimationEvent,
} from 'react'
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
import { AdminDashboardPage } from './pages/AdminDashboardPage'

function routeMotionKind(pathname: string) {
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) return 'auth'
  if (pathname === '/search' || pathname === '/results') return 'discovery'
  if (pathname.startsWith('/kos/')) return 'detail'
  if (
    pathname.startsWith('/owner') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/activity')
  ) return 'workspace'
  if (pathname.startsWith('/legal/')) return 'reading'
  return 'home'
}

function AnimatedRoutes() {
  const location = useLocation()
  const pendingLocation = useRef(location)
  const [displayLocation, setDisplayLocation] = useState(location)
  const [motionPhase, setMotionPhase] = useState<'idle' | 'exiting' | 'entering'>('idle')

  useLayoutEffect(() => {
    document.documentElement.dataset.routeMotion = routeMotionKind(location.pathname)
  }, [location.pathname])

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [displayLocation.key])

  useEffect(() => {
    if (location.key === displayLocation.key) return

    pendingLocation.current = location

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayLocation(location)
      setMotionPhase('idle')
      return
    }

    setMotionPhase('exiting')
  }, [displayLocation.key, location])

  const advanceTransition = useCallback(() => {
    if (motionPhase === 'exiting') {
      setDisplayLocation(pendingLocation.current)
      setMotionPhase('entering')
      return
    }

    if (motionPhase === 'entering') {
      setMotionPhase('idle')
    }
  }, [motionPhase])

  useEffect(() => {
    if (motionPhase === 'idle') return
    const fallbackTimer = window.setTimeout(
      advanceTransition,
      motionPhase === 'exiting' ? 260 : 560,
    )
    return () => window.clearTimeout(fallbackTimer)
  }, [advanceTransition, motionPhase])

  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) advanceTransition()
  }

  return (
    <div
      className={`papikos-route-frame papikos-route-frame--${motionPhase}`}
      key={displayLocation.key}
      onAnimationEnd={handleAnimationEnd}
    >
      <Routes location={displayLocation}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchRoutePage />} />
        <Route path="/results" element={<SearchResultsRoutePage />} />
        <Route path="/kos/:kosId" element={<KosDetailRoutePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:role" element={<Navigate replace to="/login" />} />
        <Route path="/register/:role" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/legal/:document" element={<LegalPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/owner" element={<OwnerDashboardPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
