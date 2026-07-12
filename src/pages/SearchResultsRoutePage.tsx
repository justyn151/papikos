import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header/Header'
import { SearchResultsPage } from './SearchResultsPage'

export function SearchResultsRoutePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query')?.trim() ?? ''
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const lat = latParam === null ? Number.NaN : Number(latParam)
  const lng = lngParam === null ? Number.NaN : Number(lngParam)
  const coordinates =
    latParam !== null && lngParam !== null && Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng }
      : undefined

  if (!query) return <Navigate replace to="/search" />

  return (
    <>
      <Header
        showSearch
        searchValue={query}
        onOpenSearch={() =>
          navigate(`/search?${new URLSearchParams({ query })}`)
        }
      />
      <SearchResultsPage
        query={query}
        coordinates={coordinates}
        onBack={() => navigate('/')}
        onOpenListing={(listingId) => navigate(`/kos/${listingId}`)}
      />
    </>
  )
}
