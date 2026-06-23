import { useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { formatRupiah } from '../utils/formatCurrency'
import { SearchFilters } from '../components/SearchFilters/SearchFilters'
import { KosResultsMap } from '../components/KosResultsMap/KosResultsMap'
import { kosService } from '../services/kosService'
import type { KosSearchFilters, KosSearchResult } from '../types/search'

type SearchResultsPageProps = {
  query: string
  onBack: () => void
  onOpenListing: (listingId: number) => void
}

const fallbackImage =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'

export function SearchResultsPage({
  query,
  onBack,
  onOpenListing,
}: SearchResultsPageProps) {
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const [listWidth, setListWidth] = useState(52)
  const [filters, setFilters] = useState<KosSearchFilters>({
    tags: [],
    duration: null,
    minPrice: null,
    maxPrice: null,
    facilities: [],
    rules: [],
    availableOnly: false,
  })
  const [results, setResults] = useState<KosSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isCurrentRequest = true

    kosService
      .search({ query, filters })
      .then((nextResults) => {
        if (isCurrentRequest) setResults(nextResults)
      })
      .catch(() => {
        if (isCurrentRequest) {
          setResults([])
          setLoadError('Hasil pencarian gagal dimuat. Silakan coba lagi.')
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [filters, query])

  function startResizing(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function handlePointerMove(pointerEvent: PointerEvent) {
      const container = splitContainerRef.current
      if (!container) return

      const bounds = container.getBoundingClientRect()
      const nextWidth = ((pointerEvent.clientX - bounds.left) / bounds.width) * 100
      setListWidth(Math.min(Math.max(nextWidth, 32), 68))
    }

    function stopResizing() {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResizing)
      window.removeEventListener('pointercancel', stopResizing)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResizing, { once: true })
    window.addEventListener('pointercancel', stopResizing, { once: true })
  }

  function openRecord(listingId: number) {
    onOpenListing(listingId)
  }

  function updateFilters(nextFilters: KosSearchFilters) {
    setIsLoading(true)
    setLoadError('')
    setFilters(nextFilters)
  }

  return (
    <main className="bg-white">
      <div
        className="flex min-h-[calc(100vh-68px)] flex-col lg:h-[calc(100vh-78px)] lg:flex-row lg:overflow-hidden"
        ref={splitContainerRef}
      >
        <section
          className="w-full min-w-0 overflow-y-auto px-4 pb-12 pt-5 sm:px-7 lg:h-full lg:w-[var(--list-width)]"
          style={{ '--list-width': `${listWidth}%` } as CSSProperties}
        >
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-black text-neutral-700 transition hover:bg-neutral-200"
              onClick={onBack}
              type="button"
            >
              ← Beranda
            </button>
            <SearchFilters value={filters} onChange={updateFilters} />
          </div>

          <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold leading-6 text-green-800">
            {isLoading ? 'Mencari kos...' : `Menampilkan ${results.length} kos untuk pencarian “${query}”.`}
          </div>

          <div className="mt-5 divide-y divide-neutral-200">
            {isLoading ? (
              <div className="space-y-4 py-5" aria-label="Memuat hasil pencarian">
                {[1, 2, 3].map((item) => (
                  <div className="h-44 animate-pulse rounded-2xl bg-neutral-100" key={item} />
                ))}
              </div>
            ) : loadError ? (
              <div className="py-16 text-center">
                <p className="text-lg font-black text-red-600">{loadError}</p>
              </div>
            ) : results.length > 0 ? (
              results.map(({ record, listing: fullListing }) => (
                  <article className="grid gap-4 py-5 sm:grid-cols-[190px_1fr]" key={record.id}>
                    <button
                      className="overflow-hidden rounded-xl bg-neutral-100 text-left"
                      onClick={() => openRecord(record.listingId)}
                      type="button"
                    >
                      <img
                        className="aspect-[4/3] h-full w-full object-cover transition duration-300 hover:scale-105"
                        src={fullListing.imageUrl ?? fallbackImage}
                        alt={record.name}
                      />
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-black text-neutral-600">
                          {record.tag}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            fullListing.availableRooms > 0
                              ? 'text-green-600'
                              : 'text-red-500'
                          }`}
                        >
                          {fullListing.availableRooms > 0
                            ? `Tersedia ${fullListing.availableRooms} kamar`
                            : 'Kamar penuh'}
                        </span>
                      </div>

                      <button
                        className="mt-3 block text-left text-lg font-black leading-snug text-neutral-800 hover:text-green-700"
                        onClick={() => openRecord(record.listingId)}
                        type="button"
                      >
                        {record.name}
                      </button>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
                        {record.address}
                      </p>
                      <div
                        className="mt-3 flex flex-wrap gap-1.5"
                        aria-label="Fasilitas kos"
                      >
                          {fullListing.facilities.slice(0, 5).map((facility) => (
                            <button
                              className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700 transition hover:bg-green-100 hover:text-green-800"
                              key={facility}
                              onClick={() => openRecord(record.listingId)}
                              type="button"
                              title={`Lihat detail ${record.name}`}
                            >
                              {facility}
                            </button>
                          ))}
                          {fullListing.facilities.length > 5 && (
                            <button
                              className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-500 transition hover:bg-neutral-200"
                              onClick={() => openRecord(record.listingId)}
                              type="button"
                              title={`Lihat semua fasilitas ${record.name}`}
                            >
                              +{fullListing.facilities.length - 5} lainnya
                            </button>
                          )}
                      </div>
                      <p className="mt-4 text-right text-lg font-black text-neutral-900">
                        {formatRupiah(record.monthlyPrice)}
                        <span className="text-sm font-semibold text-neutral-500">/bulan</span>
                      </p>
                    </div>
                  </article>
              ))
            ) : (
              <div className="py-16 text-center">
                <p className="text-xl font-black text-neutral-700">Kos belum ditemukan</p>
                <p className="mt-2 text-sm font-semibold text-neutral-500">
                  Coba gunakan nama kota, area, atau kampus lain.
                </p>
                <button
                  className="mt-5 rounded-full bg-green-600 px-5 py-3 text-sm font-black text-white"
                  onClick={onBack}
                  type="button"
                >
                  Kembali ke beranda
                </button>
              </div>
            )}
          </div>
        </section>

        <button
          className="relative z-10 hidden w-2 shrink-0 cursor-col-resize bg-neutral-200 transition hover:bg-green-500 lg:block"
          onPointerDown={startResizing}
          type="button"
          aria-label="Ubah ukuran panel daftar dan peta"
          title="Geser untuk mengubah ukuran panel"
        >
          <span className="absolute left-1/2 top-1/2 h-12 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-400" />
        </button>

        <section
          className="h-[420px] min-w-0 bg-neutral-100 lg:h-full lg:flex-1"
          aria-label="Peta hasil pencarian"
        >
          <KosResultsMap
            records={results.map(({ record }) => record)}
            resizeKey={listWidth}
            onOpenListing={onOpenListing}
          />
        </section>
      </div>
    </main>
  )
}
