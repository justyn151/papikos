import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header/Header'
import { SearchResultsPage } from './SearchResultsPage'

export function SearchResultsRoutePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query')?.trim() ?? ''

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
        onBack={() => navigate('/')}
        onOpenListing={(listingId) => navigate(`/kos/${listingId}`)}
      />
    </>
  )
}
