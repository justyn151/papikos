import { useState } from 'react'
import type { RentalDuration } from '../../types/kos'
import type { KosSearchFilters } from '../../types/search'

type FilterPanel = 'type' | 'duration' | 'price' | 'facilities' | 'rules'

type SearchFiltersProps = {
  value: KosSearchFilters
  onChange: (value: KosSearchFilters) => void
}

const tagOptions = ['Putra', 'Putri', 'Campur']
const durationOptions: RentalDuration[] = ['Bulanan', '3 Bulan', '6 Bulan', 'Tahunan']
const facilityGroups = [
  {
    title: 'Fasilitas kamar',
    options: ['AC', 'Kasur', 'Lemari', 'Meja belajar', 'Ventilasi'],
  },
  {
    title: 'Fasilitas kamar mandi',
    options: ['Kamar mandi dalam', 'Kamar mandi luar', 'Water heater'],
  },
  {
    title: 'Fasilitas bersama',
    options: ['Wi-Fi', 'Dapur bersama', 'Parkir motor', 'CCTV'],
  },
]
const ruleOptions = [
  { label: 'Tidak merokok di kamar', value: 'tidak merokok' },
  { label: 'Tamu wajib melapor', value: 'tamu wajib melapor' },
  { label: 'Maks. 1 orang/kamar', value: 'maksimal 1 orang' },
  { label: 'Akses 24 jam', value: 'akses 24 jam' },
  { label: 'Tidak boleh membawa hewan', value: 'tidak boleh membawa hewan' },
]
const MAX_PRICE = 20000000

function formatPrice(value: number | null) {
  return value === null ? '' : `Rp ${value.toLocaleString('id-ID')}`
}

function parsePrice(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits ? Math.min(Number(digits), MAX_PRICE) : null
}

function copyFilters(value: KosSearchFilters): KosSearchFilters {
  return {
    ...value,
    tags: [...value.tags],
    facilities: [...value.facilities],
    rules: [...value.rules],
  }
}

function toggleItem(items: string[], item: string) {
  return items.includes(item)
    ? items.filter((current) => current !== item)
    : [...items, item]
}

export function SearchFilters({ value, onChange }: SearchFiltersProps) {
  const [openPanel, setOpenPanel] = useState<FilterPanel | null>(null)
  const [draft, setDraft] = useState(() => copyFilters(value))
  const [isClosing, setIsClosing] = useState(false)
  const sliderMinimum = Math.min(
    draft.minPrice ?? 0,
    draft.maxPrice ?? MAX_PRICE,
  )
  const sliderMaximum = Math.max(
    draft.minPrice ?? 0,
    draft.maxPrice ?? MAX_PRICE,
  )
  const minimumPosition = (sliderMinimum / MAX_PRICE) * 100
  const maximumPosition = (sliderMaximum / MAX_PRICE) * 100

  function open(panel: FilterPanel) {
    setIsClosing(false)
    setDraft(copyFilters(value))
    setOpenPanel(panel)
  }

  function close() {
    setIsClosing(true)
    window.setTimeout(() => {
      setOpenPanel(null)
      setIsClosing(false)
    }, 180)
  }

  function save() {
    const next = copyFilters(draft)
    if (
      next.minPrice !== null &&
      next.maxPrice !== null &&
      next.minPrice > next.maxPrice
    ) {
      const previousMinimum = next.minPrice
      next.minPrice = next.maxPrice
      next.maxPrice = previousMinimum
    }
    onChange(next)
    close()
  }

  function clearPanel(panel: FilterPanel) {
    const next = copyFilters(draft)
    if (panel === 'type') next.tags = []
    if (panel === 'duration') next.duration = null
    if (panel === 'price') {
      next.minPrice = null
      next.maxPrice = null
    }
    if (panel === 'facilities') next.facilities = []
    if (panel === 'rules') next.rules = []
    setDraft(next)
  }

  function chipClass(active: boolean) {
    return `whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition ${
      active
        ? 'border-neutral-800 bg-neutral-50 text-neutral-800'
        : 'border-neutral-200 bg-white text-neutral-600 hover:border-green-400 hover:text-green-700'
    }`
  }

  function footer(panel: FilterPanel) {
    return (
      <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4">
        <button className="font-black text-neutral-600 hover:text-red-500" onClick={() => clearPanel(panel)} type="button">
          Hapus
        </button>
        <button className="font-black text-green-600 hover:text-green-700" onClick={save} type="button">
          Simpan
        </button>
      </div>
    )
  }

  function checkbox(label: string, checked: boolean, onToggle: () => void) {
    return (
      <label className="flex cursor-pointer items-center gap-4 py-2 text-base font-semibold text-neutral-600" key={label}>
        <input
          className="size-6 cursor-pointer rounded border-neutral-300 accent-green-600"
          checked={checked}
          onChange={onToggle}
          type="checkbox"
        />
        {label}
      </label>
    )
  }

  function popover(panel: Exclude<FilterPanel, 'facilities' | 'rules'>) {
    if (openPanel !== panel) return null

    return (
      <>
        <button
          className="fixed inset-0 z-20 cursor-default"
          onClick={close}
          style={{ animation: isClosing ? 'payment-backdrop-out 180ms ease-in both' : 'payment-backdrop-in 180ms ease-out both' }}
          type="button"
          aria-label="Tutup filter"
        />
        <div
          className="absolute left-0 top-[calc(100%+8px)] z-30 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl"
          style={{ animation: isClosing ? 'payment-modal-out 180ms ease-in both' : 'payment-modal-in 220ms cubic-bezier(0.22,1,0.36,1) both' }}
        >
          {panel === 'type' && (
            <div className="p-5">
              <p className="mb-3 leading-6 text-neutral-700">Tipe kos yang kamu cari berdasarkan gender.</p>
              {tagOptions.map((tag) => checkbox(tag, draft.tags.includes(tag), () => setDraft({ ...draft, tags: toggleItem(draft.tags, tag) })))}
            </div>
          )}

          {panel === 'duration' && (
            <div className="p-5">
              <p className="mb-3 leading-6 text-neutral-700">Pilih waktu pembayaran sewa yang kamu inginkan.</p>
              {durationOptions.map((duration) => (
                <label className="flex cursor-pointer items-center gap-4 py-3 text-base font-semibold text-neutral-600" key={duration}>
                  <input
                    className="size-6 cursor-pointer accent-green-600"
                    checked={draft.duration === duration}
                    onChange={() => setDraft({ ...draft, duration })}
                    name="rental-duration"
                    type="radio"
                  />
                  {duration}
                </label>
              ))}
            </div>
          )}

          {panel === 'price' && (
            <div className="p-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <label className="text-sm font-black text-neutral-700">
                  Minimal
                  <input
                    className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-3 font-semibold outline-none focus:border-green-500"
                    inputMode="numeric"
                    onChange={(event) => setDraft({ ...draft, minPrice: parsePrice(event.target.value) })}
                    placeholder="Rp 0"
                    type="text"
                    value={formatPrice(draft.minPrice)}
                  />
                </label>
                <span className="pb-3 text-neutral-400">—</span>
                <label className="text-sm font-black text-neutral-700">
                  Maksimal
                  <input
                    className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-3 font-semibold outline-none focus:border-green-500"
                    inputMode="numeric"
                    onChange={(event) => setDraft({ ...draft, maxPrice: parsePrice(event.target.value) })}
                    placeholder="Rp 20.000.000"
                    type="text"
                    value={formatPrice(draft.maxPrice)}
                  />
                </label>
              </div>
              <div className="mt-6">
                <p className="text-xs font-black text-neutral-500">Rentang harga</p>
                <div className="relative mt-3 h-7">
                  <div
                    className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
                    style={{
                      background: `linear-gradient(to right, #e5e5e5 0%, #e5e5e5 ${minimumPosition}%, #16a34a ${minimumPosition}%, #16a34a ${maximumPosition}%, #e5e5e5 ${maximumPosition}%, #e5e5e5 100%)`,
                    }}
                  />
                  <input
                    aria-label="Harga minimum"
                    className="price-range-input"
                    max={MAX_PRICE}
                    min="0"
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        minPrice: Math.min(Number(event.target.value), sliderMaximum),
                      })
                    }
                    step="100000"
                    type="range"
                    value={sliderMinimum}
                  />
                  <input
                    aria-label="Harga maksimum"
                    className="price-range-input"
                    max={MAX_PRICE}
                    min="0"
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        maxPrice: Math.max(Number(event.target.value), sliderMinimum),
                      })
                    }
                    step="100000"
                    type="range"
                    value={sliderMaximum}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold text-neutral-400">
                  <span>Rp 0</span>
                  <span>Rp 20.000.000</span>
                </div>
              </div>
            </div>
          )}
          {footer(panel)}
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative">
        <button className={chipClass(value.tags.length > 0)} onClick={() => open('type')} type="button">
          {value.tags.length ? `${value.tags.length} tipe kos` : 'Semua Tipe Kos'}
        </button>
        {popover('type')}
      </div>

      <div className="relative">
        <button className={chipClass(Boolean(value.duration))} onClick={() => open('duration')} type="button">
          {value.duration ?? 'Durasi sewa'}
        </button>
        {popover('duration')}
      </div>

      <div className="relative">
        <button className={chipClass(value.minPrice !== null || value.maxPrice !== null)} onClick={() => open('price')} type="button">
          Harga
        </button>
        {popover('price')}
      </div>

      <button className={chipClass(value.facilities.length > 0)} onClick={() => open('facilities')} type="button">
        {value.facilities.length ? `Fasilitas (${value.facilities.length})` : 'Fasilitas'}
      </button>

      <button className={chipClass(value.rules.length > 0)} onClick={() => open('rules')} type="button">
        {value.rules.length ? `Aturan Kos (${value.rules.length})` : 'Aturan Kos'}
      </button>

      <button
        className={chipClass(value.availableOnly)}
        onClick={() => onChange({ ...value, availableOnly: !value.availableOnly })}
        type="button"
        aria-pressed={value.availableOnly}
      >
        Kamar Tersedia
      </button>

      {(openPanel === 'facilities' || openPanel === 'rules') && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={close}
          style={{ animation: isClosing ? 'payment-backdrop-out 180ms ease-in both' : 'payment-backdrop-in 180ms ease-out both' }}
        >
          <section
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={openPanel === 'facilities' ? 'Filter fasilitas' : 'Filter aturan kos'}
            style={{ animation: isClosing ? 'payment-modal-out 180ms ease-in both' : 'payment-modal-in 240ms cubic-bezier(0.22,1,0.36,1) both' }}
          >
            <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <h2 className="text-xl font-black text-neutral-800">
                {openPanel === 'facilities' ? 'Fasilitas' : 'Aturan Kos'}
              </h2>
              <button className="grid size-10 place-items-center rounded-full text-3xl text-neutral-500 hover:bg-neutral-100" onClick={close} type="button" aria-label="Tutup">×</button>
            </header>
            <div className="overflow-y-auto px-6 py-2">
              {openPanel === 'facilities' ? (
                facilityGroups.map((group) => (
                  <div className="border-b border-neutral-200 py-5 last:border-0" key={group.title}>
                    <h3 className="mb-3 text-lg font-black text-neutral-700">{group.title}</h3>
                    <div className="grid gap-x-8 sm:grid-cols-2">
                      {group.options.map((facility) => checkbox(facility, draft.facilities.includes(facility), () => setDraft({ ...draft, facilities: toggleItem(draft.facilities, facility) })))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-5">
                  <p className="mb-4 leading-6 text-neutral-700">Layanan dan peraturan kos untuk kenyamanan kamu selama ngekos.</p>
                  <div className="grid gap-x-8 sm:grid-cols-2">
                    {ruleOptions.map((rule) => checkbox(rule.label, draft.rules.includes(rule.value), () => setDraft({ ...draft, rules: toggleItem(draft.rules, rule.value) })))}
                  </div>
                </div>
              )}
            </div>
            {footer(openPanel)}
          </section>
        </div>
      )}
    </div>
  )
}
