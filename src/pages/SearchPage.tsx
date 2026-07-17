import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon/Icon'
import { kosService } from '../services/kosService'
import type { SearchCoordinates, SearchMetadata } from '../types/search'
import { getSearchSuggestions } from '../utils/searchSuggestions'

type SearchPageProps = {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string, coordinates?: SearchCoordinates) => void
  onBack: () => void
}

const searchTabs = ['Semua', 'Provinsi', 'Kota', 'Kampus', 'Area'] as const

type SearchTab = (typeof searchTabs)[number]

const tabType: Record<Exclude<SearchTab, 'Semua'>, string> = {
  Provinsi: 'province',
  Kota: 'city',
  Kampus: 'campus',
  Area: 'area',
}

function locationType(id: string) {
  return id.split('-')[0]
}

export function SearchPage({ value, onChange, onSearch, onBack }: SearchPageProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>('Semua')
  const [visibleLocationCount, setVisibleLocationCount] = useState(24)
  const [locationStatus, setLocationStatus] = useState('')
  const [metadata, setMetadata] = useState<SearchMetadata>({
    cities: [],
    popularCampuses: [],
    searchableLocations: [],
  })
  const [metadataError, setMetadataError] = useState('')
  const suggestions = getSearchSuggestions(metadata, value)
  const isTyping = value.trim().length > 0
  const browsableLocations = useMemo(() => {
    const locations = metadata.searchableLocations ?? []
    if (activeTab === 'Semua') return locations
    return locations.filter((location) => locationType(location.id) === tabType[activeTab])
  }, [activeTab, metadata.searchableLocations])
  const visibleLocations = browsableLocations.slice(0, visibleLocationCount)

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
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        onChange('Lokasi saya')
        setLocationStatus('Lokasi ditemukan.')
        onSearch('Lokasi saya', coordinates)
      },
      () => {
        setLocationStatus('Izin lokasi ditolak atau lokasi tidak dapat ditemukan.')
      },
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5 sm:px-8">
        <form
          className="flex items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (value.trim()) onSearch(value.trim())
          }}
        >
          <button
            className="grid size-11 shrink-0 place-items-center rounded-full text-3xl text-neutral-600 transition hover:bg-neutral-100"
            onClick={onBack}
            type="button"
            aria-label="Kembali ke halaman utama"
          >
            <Icon className="size-6" name="arrowLeft" />
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
                <Icon className="size-5" name="close" />
              </button>
            )}
          </div>
          <button
            className="shrink-0 rounded-full bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
            disabled={!value.trim()}
            type="submit"
          >
            Cari
          </button>
        </form>

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
                    <Icon className="size-5" name="locationTarget" />
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
          <span className="grid size-12 place-items-center rounded-lg bg-neutral-100 text-neutral-600" aria-hidden="true">
            <Icon className="size-6" name="locationTarget" />
          </span>
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
              onClick={() => {
                setActiveTab(tab)
                setVisibleLocationCount(24)
              }}
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
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-neutral-800">Jelajahi semua lokasi</h2>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                {browsableLocations.length} {activeTab.toLocaleLowerCase('id-ID')} tersedia di katalog pencarian.
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-500">
              Provinsi, kota, area, dan kampus
            </span>
          </div>

          {visibleLocations.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleLocations.map((location) => (
                <button
                  className="rounded-2xl border border-neutral-200 p-4 text-left transition hover:border-green-400 hover:bg-green-50"
                  key={location.id}
                  onClick={() => chooseLocation(location.searchValue)}
                  type="button"
                >
                  <span className="block truncate font-black text-neutral-800">{location.label}</span>
                  <span className="mt-1 block text-xs font-semibold text-neutral-400">{location.description}</span>
                </button>
              ))}
            </div>
          ) : !metadataError ? (
            <p className="mt-5 rounded-2xl bg-neutral-50 p-5 text-sm font-semibold text-neutral-500">
              Belum ada lokasi untuk kategori ini.
            </p>
          ) : null}

          {visibleLocationCount < browsableLocations.length && (
            <button
              className="mt-5 w-full rounded-full border border-neutral-300 px-5 py-3 text-sm font-black text-neutral-700 transition hover:border-green-500 hover:text-green-700"
              onClick={() => setVisibleLocationCount((count) => count + 24)}
              type="button"
            >
              Tampilkan lebih banyak ({browsableLocations.length - visibleLocationCount} tersisa)
            </button>
          )}
          {metadataError && (
            <p className="py-5 text-sm font-bold text-red-500">{metadataError}</p>
          )}
        </section>
      </div>
    </main>
  )
}
