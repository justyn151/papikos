import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePageNavigate } from '../navigation/usePageNavigate'
import { SearchPage } from './SearchPage'

export function SearchRoutePage() {
  const navigate = usePageNavigate()
  const [searchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get('query') ?? '')

  return (
    <SearchPage
      value={value}
      onChange={setValue}
      onSearch={(query, coordinates) => {
        const params = new URLSearchParams({ query })
        if (coordinates) {
          params.set('lat', String(coordinates.lat))
          params.set('lng', String(coordinates.lng))
        }
        navigate(`/results?${params}`)
      }}
      onBack={() => navigate('/')}
    />
  )
}
