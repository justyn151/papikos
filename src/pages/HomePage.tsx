import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AboutPapikos } from '../components/AboutPapikos/AboutPapikos'
import { Header } from '../components/Header/Header'
import { KosGallery } from '../components/KosGallery/KosGallery'
import { SearchHero } from '../components/SearchHero/SearchHero'
import { kosService } from '../services/kosService'
import type { KosListing } from '../types/kos'

export function HomePage() {
  const navigate = useNavigate()
  const [searchLocation, setSearchLocation] = useState('')
  const [searchMessage, setSearchMessage] = useState(
    'Coba cari lokasi kampus, kantor, atau area favoritmu.',
  )
  const [showHeaderSearch, setShowHeaderSearch] = useState(false)
  const [featuredListings, setFeaturedListings] = useState<KosListing[]>([])
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true)
  const [featuredError, setFeaturedError] = useState('')

  useEffect(() => {
    let isCurrentRequest = true

    kosService
      .getFeatured()
      .then((listings) => {
        if (isCurrentRequest) setFeaturedListings(listings)
      })
      .catch(() => {
        if (isCurrentRequest) setFeaturedError('Rekomendasi kos belum dapat dimuat.')
      })
      .finally(() => {
        if (isCurrentRequest) setIsFeaturedLoading(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [])

  useEffect(() => {
    const heroSearchForm = document.getElementById('hero-search-form')
    if (!heroSearchForm) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowHeaderSearch(
          !entry.isIntersecting && entry.boundingClientRect.bottom < 78,
        )
      },
      { rootMargin: '-78px 0px 0px', threshold: 0 },
    )

    observer.observe(heroSearchForm)
    return () => observer.disconnect()
  }, [])

  function openSearch() {
    const params = new URLSearchParams()
    if (searchLocation) params.set('query', searchLocation)
    navigate(`/search${params.size ? `?${params}` : ''}`)
  }

  return (
    <>
      <Header
        showSearch={showHeaderSearch}
        searchValue={searchLocation}
        onOpenSearch={openSearch}
      />
      <main>
        <SearchHero
          location={searchLocation}
          message={searchMessage}
          onOpenSearch={openSearch}
          onPopularLocationSelect={(location) => {
            setSearchLocation(location)
            setSearchMessage(`${location} masuk kolom pencarian.`)
          }}
        />
        {isFeaturedLoading ? (
          <div className="mx-auto my-16 h-80 w-[min(92%,900px)] animate-pulse rounded-3xl bg-neutral-100" />
        ) : featuredError ? (
          <p className="mx-auto my-16 max-w-xl rounded-2xl bg-red-50 p-5 text-center font-bold text-red-600">
            {featuredError}
          </p>
        ) : (
          <KosGallery
            listings={featuredListings}
            onShowDetail={(listing) => navigate(`/kos/${listing.id}`)}
          />
        )}
        <AboutPapikos />
      </main>
    </>
  )
}
