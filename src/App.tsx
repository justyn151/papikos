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
import { SearchResultsRoutePage } from './pages/SearchResultsRoutePage'
import { SearchRoutePage } from './pages/SearchRoutePage'

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
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
