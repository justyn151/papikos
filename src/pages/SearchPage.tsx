import { useEffect, useState } from 'react'
import { kosService } from '../services/kosService'
import type { SearchMetadata } from '../types/search'
import { getSearchSuggestions } from '../utils/searchSuggestions'

type SearchPageProps = {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  onBack: () => void
}

const searchTabs = ['Kampus', 'Area'] as const

export function SearchPage({ value, onChange, onSearch, onBack }: SearchPageProps) {
  const [activeTab, setActiveTab] = useState<(typeof searchTabs)[number]>('Kampus')
  const [expandedCity, setExpandedCity] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState('')
  const [metadata, setMetadata] = useState<SearchMetadata>({
    cities: [],
    popularCampuses: [],
    searchableLocations: [],
  })
  const [metadataError, setMetadataError] = useState('')
  const suggestions = getSearchSuggestions(metadata, value)
  const isTyping = value.trim().length > 0

  useEffect(() => {
    let isCurrentRequest = true

    kosService
      .getSearchMetadata()
      .then((nextMetadata) => {
        if (isCurrentRequest) setMetadata(nextMetadata)
      })
      .catch(() => {
        if (isCurrentRequest) {
          setMetadataError('Pilihan lokasi gagal dimuat.')
        }
      })

    return () => {
      isCurrentRequest = false
    }
  }, [])

  function chooseLocation(location: string) {
    onChange(location)
    onSearch(location)
  }

  function findNearbyLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Browser kamu tidak mendukung pencarian lokasi.')
      return
    }

    setLocationStatus('Mencari lokasi kamu...')
    navigator.geolocation.getCurrentPosition(
      () => {
        onChange('Lokasi saya')
        setLocationStatus('Lokasi ditemukan.')
        onSearch('Lokasi saya')
      },
      () => {
        setLocationStatus('Izin lokasi ditolak atau lokasi tidak dapat ditemukan.')
      },
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-full text-3xl text-neutral-600 transition hover:bg-neutral-100"
            onClick={onBack}
            type="button"
            aria-label="Kembali ke halaman utama"
          >
            ←
          </button>
          <div className="relative min-w-0 flex-1">
            <input
              autoFocus
              className="w-full rounded-lg border border-neutral-300 py-3 pl-4 pr-12 text-base font-semibold text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
              onChange={(event) => onChange(event.target.value)}
              placeholder="Coba Jogja, UGM, atau Pogung"
              type="search"
              value={value}
            />
            {value && (
              <button
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-xl font-bold text-neutral-500 hover:bg-neutral-100"
                onClick={() => onChange('')}
                type="button"
                aria-label="Hapus pencarian"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {isTyping && (
          <section
            className="ml-14 mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
            aria-label="Saran pencarian"
          >
            {suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <button
                  className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-green-50"
                  key={suggestion.id}
                  onClick={() => chooseLocation(suggestion.searchValue)}
                  type="button"
                >
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-green-50 text-lg text-green-700"
                    aria-hidden="true"
                  >
                    ⌖
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-black text-neutral-800">
                      {suggestion.label}
                    </span>
                    <span className="block text-sm font-semibold text-neutral-400">
                      {suggestion.description}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-5 text-sm font-semibold text-neutral-500">
                Lokasi tidak ditemukan. Coba nama kota, area, atau kampus lain.
              </p>
            )}
          </section>
        )}

        <button
          className="mt-6 flex w-full items-center gap-4 rounded-xl border border-neutral-200 p-4 text-left transition hover:border-green-300 hover:bg-green-50"
          onClick={findNearbyLocation}
          type="button"
        >
          <span className="grid size-12 place-items-center rounded-lg bg-neutral-100 text-2xl" aria-hidden="true">⌾</span>
          <span>
            <span className="block font-black text-neutral-700">Cari di lokasi sekitar saya</span>
            {locationStatus && <span className="mt-1 block text-sm font-semibold text-neutral-500">{locationStatus}</span>}
          </span>
        </button>

        <div className="mt-6 flex gap-7 overflow-x-auto border-b border-neutral-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {searchTabs.map((tab) => (
            <button
              className={
                'shrink-0 border-b-2 px-1 pb-3 text-sm font-black transition ' +
                (activeTab === tab
                  ? 'border-green-500 text-neutral-800'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700')
              }
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-black text-neutral-700">Pencarian populer</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {metadata.popularCampuses.map((search) => (
              <button
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-bold text-neutral-600 transition hover:border-green-400 hover:bg-green-50 hover:text-green-700"
                key={search}
                onClick={() => chooseLocation(search)}
                type="button"
              >
                {search}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-black text-neutral-700">{activeTab} berdasarkan kota</h2>
          <div className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
            {metadata.cities.map((searchCity) => {
              const isExpanded = expandedCity === searchCity.city
              const locations =
                activeTab === 'Kampus'
                  ? searchCity.campuses
                  : searchCity.areas

              return (
                <div key={searchCity.city}>
                  <button
                    className="flex w-full items-center justify-between py-5 text-left text-xl font-black text-neutral-700"
                    onClick={() =>
                      setExpandedCity(isExpanded ? null : searchCity.city)
                    }
                    type="button"
                    aria-expanded={isExpanded}
                  >
                    {searchCity.city}
                    <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span>
                  </button>
                  {isExpanded && (
                    <div className="flex flex-wrap gap-2 pb-5">
                      {locations.map((location) => (
                        <button
                          className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-600 transition hover:bg-green-100 hover:text-green-700"
                          key={location}
                          onClick={() => chooseLocation(location)}
                          type="button"
                        >
                          {location}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {metadataError && (
            <p className="py-5 text-sm font-bold text-red-500">{metadataError}</p>
          )}
        </section>
      </div>
    </main>
  )
}
