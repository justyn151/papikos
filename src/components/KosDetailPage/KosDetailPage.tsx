import { useEffect, useRef, useState } from 'react'
import { MediaLightbox } from '../MediaLightbox/MediaLightbox'
import {
  PaymentBreakdownModal,
  type PaymentBreakdownLine,
} from '../PaymentBreakdownModal/PaymentBreakdownModal'
import type { KosListing } from '../../types/kos'
import { formatRupiah } from '../../utils/formatCurrency'

type KosDetailPageProps = {
  kos: KosListing
  onBack: () => void
}

const rentalPeriods = [
  { months: 1, label: 'Per bulan' },
  { months: 3, label: 'Per 3 bulan' },
  { months: 6, label: 'Per 6 bulan' },
  { months: 12, label: 'Per tahun' },
]

type PaymentChoice = 'full' | 'dp'
type BreakdownType = 'dp' | 'settlement' | 'full' | null

export function KosDetailPage({ kos, onBack }: KosDetailPageProps) {
  const mediaItems =
    kos.media.length > 0
      ? kos.media
      : [
          {
            id: 'cover',
            category: 'cover',
            label: 'Foto kos',
            type: 'image' as const,
            url: kos.imageUrl,
            alt: kos.imageAlt,
          },
        ]
  const thumbnailStripRef = useRef<HTMLDivElement>(null)
  const [activeMediaId, setActiveMediaId] = useState(mediaItems[0].id)
  const [actionStatus, setActionStatus] = useState('Pilih aksi untuk lanjut.')
  const [rentalStatus, setRentalStatus] = useState('Pilih durasi dan metode pembayaran sebelum mengajukan sewa.')
  const [rentalMonths, setRentalMonths] = useState(1)
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('full')
  const [breakdownType, setBreakdownType] = useState<BreakdownType>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const activeMedia = mediaItems.find((item) => item.id === activeMediaId) ?? mediaItems[0]
  const activeMediaIndex = mediaItems.findIndex((item) => item.id === activeMedia.id)
  const rentalTotal = kos.monthlyPrice * rentalMonths
  const selectedRentalPeriod =
    rentalPeriods.find((period) => period.months === rentalMonths) ?? rentalPeriods[0]
  const discount = Math.round((rentalTotal * kos.paymentTerms.discountPercentage) / 100)
  const dpRent = Math.round((rentalTotal * kos.paymentTerms.dpPercentage) / 100)
  const remainingRent = rentalTotal - dpRent
  const dpFirstPayment = dpRent + kos.paymentTerms.serviceFee
  const settlementTotal =
    remainingRent +
    kos.paymentTerms.adminFee +
    kos.paymentTerms.deposit +
    kos.paymentTerms.serviceFee -
    discount
  const fullPaymentTotal =
    rentalTotal +
    kos.paymentTerms.adminFee +
    kos.paymentTerms.deposit +
    kos.paymentTerms.serviceFee -
    discount

  const breakdowns: Record<Exclude<BreakdownType, null>, {
    title: string
    lines: PaymentBreakdownLine[]
    totalLabel: string
    total: number
  }> = {
    dp: {
      title: 'Detail Pembayaran Pertama (DP)',
      lines: [
        {
          label: `Uang muka (${kos.paymentTerms.dpPercentage}%)`,
          amount: dpRent,
        },
        {
          label: 'Biaya layanan Papikos',
          amount: kos.paymentTerms.serviceFee,
        },
      ],
      totalLabel: 'Total pembayaran pertama',
      total: dpFirstPayment,
    },
    settlement: {
      title: 'Detail Pembayaran Pelunasan',
      lines: [
        { label: 'Sisa biaya sewa', amount: remainingRent },
        {
          label: 'Benefit asuransi & biaya admin',
          amount: kos.paymentTerms.adminFee,
        },
        { label: 'Deposit', amount: kos.paymentTerms.deposit },
        {
          label: 'Biaya layanan Papikos',
          amount: kos.paymentTerms.serviceFee,
        },
        {
          label: `Promo ${kos.paymentTerms.discountPercentage}%`,
          amount: discount,
          isDiscount: true,
        },
      ],
      totalLabel: 'Total pelunasan',
      total: settlementTotal,
    },
    full: {
      title: 'Detail Pembayaran Penuh',
      lines: [
        { label: 'Biaya sewa', amount: rentalTotal },
        {
          label: 'Benefit asuransi & biaya admin',
          amount: kos.paymentTerms.adminFee,
        },
        { label: 'Deposit', amount: kos.paymentTerms.deposit },
        {
          label: 'Biaya layanan Papikos',
          amount: kos.paymentTerms.serviceFee,
        },
        {
          label: `Promo ${kos.paymentTerms.discountPercentage}%`,
          amount: discount,
          isDiscount: true,
        },
      ],
      totalLabel: 'Total pembayaran penuh',
      total: fullPaymentTotal,
    },
  }
  const activeBreakdown = breakdownType ? breakdowns[breakdownType] : null

  useEffect(() => {
    const strip = thumbnailStripRef.current
    const activeThumbnail = strip?.querySelector<HTMLElement>(
      '[data-media-id="' + activeMediaId + '"]',
    )

    if (!strip || !activeThumbnail) return

    strip.scrollTo({
      left:
        activeThumbnail.offsetLeft -
        strip.clientWidth / 2 +
        activeThumbnail.offsetWidth / 2,
      behavior: 'smooth',
    })
  }, [activeMediaId])

  function showPreviousMedia() {
    const previousIndex = (activeMediaIndex - 1 + mediaItems.length) % mediaItems.length
    setActiveMediaId(mediaItems[previousIndex].id)
  }

  function showNextMedia() {
    const nextIndex = (activeMediaIndex + 1) % mediaItems.length
    setActiveMediaId(mediaItems[nextIndex].id)
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl overflow-x-clip px-4 pb-16 pt-6 sm:px-8 lg:px-[86px]">
      <button
        className="mb-5 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-black text-neutral-700 transition hover:bg-neutral-200 active:scale-[0.98]"
        onClick={onBack}
        type="button"
      >
        ← Kembali ke beranda
      </button>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0">
          <div className="group relative aspect-video overflow-hidden rounded-[2rem] bg-neutral-950">
            {activeMedia.type === 'video' ? (
              <video
                className="h-full w-full bg-black object-contain"
                controls
                playsInline
                poster={activeMedia.thumbnailUrl ?? kos.imageUrl}
                preload="metadata"
              >
                <source src={activeMedia.url} type="video/mp4" />
                Browser kamu belum mendukung pemutar video HTML.
              </video>
            ) : (
              <button
                className="relative block h-full w-full cursor-zoom-in text-left"
                onClick={() => setIsLightboxOpen(true)}
                type="button"
                aria-label={`Perbesar ${activeMedia.label}`}
              >
                <img className="h-full w-full bg-neutral-950 object-contain" src={activeMedia.url} alt={activeMedia.alt} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/50" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-white/80">{activeMedia.label}</p>
                  <h1 className="mt-1 break-words text-3xl font-black leading-none tracking-[-0.05em] sm:text-5xl">{kos.title}</h1>
                </div>
              </button>
            )}

            <button
              className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl font-black text-neutral-800 opacity-100 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:left-5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              onClick={showPreviousMedia}
              type="button"
              aria-label="Media sebelumnya"
            >
              ←
            </button>
            <button
              className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl font-black text-neutral-800 opacity-100 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:right-5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              onClick={showNextMedia}
              type="button"
              aria-label="Media berikutnya"
            >
              →
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-neutral-100 p-2">
            <div
              className="flex min-w-0 gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              ref={thumbnailStripRef}
            >
              {mediaItems.map((media) => {
                const isActive = media.id === activeMediaId

                return (
                  <button
                    className={
                      'w-[126px] shrink-0 overflow-hidden rounded-lg border-[3px] bg-white text-left transition active:scale-[0.98] sm:w-[145px] ' +
                      (isActive ? 'border-green-500' : 'border-transparent opacity-75 hover:opacity-100')
                    }
                    data-media-id={media.id}
                    key={media.id}
                    onClick={() => setActiveMediaId(media.id)}
                    type="button"
                  >
                    <img
                      className="aspect-video w-full bg-neutral-100 object-cover"
                      src={media.thumbnailUrl ?? media.url}
                      alt={media.alt}
                    />
                    <span className="block truncate bg-white px-3 py-2 text-xs font-black text-neutral-700">{media.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <section className="mt-8 border-t border-neutral-200 pt-7">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-neutral-900">Informasi lainnya</h2>

            <div className="mt-6">
              <h3 className="text-lg font-black text-neutral-800">Spesifikasi tipe kamar</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-4">
                  <span className="text-2xl" aria-hidden="true">▣</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Ukuran kamar</p>
                    <p className="mt-1 font-black text-neutral-700">{kos.roomSize}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-4">
                  <span className="text-2xl" aria-hidden="true">▤</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Ketersediaan</p>
                    <p className="mt-1 font-black text-neutral-700">{kos.availableRooms} kamar tersedia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-neutral-200 pt-7">
              <h3 className="text-lg font-black text-neutral-800">Fasilitas lengkap</h3>
              <div className="mt-5 space-y-7">
                {kos.facilityCategories.map((category) => (
                  <section key={category.id}>
                    <h4 className="font-black text-neutral-700">{category.title}</h4>
                    <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {category.items.map((item) => (
                        <li className="flex items-center gap-3 text-sm font-semibold text-neutral-600" key={item}>
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-green-50 text-green-600" aria-hidden="true">
                            ✓
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>

            <div className="mt-7 border-t border-neutral-200 pt-7">
              <h3 className="text-lg font-black text-neutral-800">Aturan kos</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {kos.rules.map((rule) => (
                  <li className="flex gap-3 text-sm font-semibold text-neutral-600" key={rule}>
                    <span className="text-green-600" aria-hidden="true">✓</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 border-t border-neutral-200 pt-7">
              <h3 className="text-lg font-black text-neutral-800">Informasi pemilik</h3>
              <div className="mt-4 flex items-center gap-4 rounded-2xl bg-neutral-50 p-4">
                <span className="grid size-12 place-items-center rounded-full bg-green-100 text-xl" aria-hidden="true">👤</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Pemilik kos</p>
                  <p className="mt-1 text-lg font-black text-neutral-800">{kos.owner}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5 lg:h-full">
          <aside className="rounded-[2rem] border border-neutral-100 bg-white p-5 shadow-xl shadow-neutral-200/70 sm:p-7">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">Kos {kos.tag}</span>
            <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-yellow-700">⭐ {kos.rating}</span>
          </div>

          <h2 className="mt-4 break-words text-3xl font-black leading-none tracking-[-0.05em] text-neutral-900">{kos.title}</h2>
          <p className="mt-3 break-words text-sm font-bold text-neutral-500">{kos.address}</p>
          <p className="mt-5 leading-7 text-neutral-600">{kos.description}</p>

          <div className="mt-6">
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-400">Fasilitas</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {kos.facilities.map((facility) => (
                <span className="rounded-full bg-green-50 px-3 py-2 text-sm font-bold text-green-700" key={facility}>
                  {facility}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              className="rounded-full bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700 active:scale-[0.98]"
              onClick={() => setActionStatus('Jadwal survey disiapkan. Pilih tanggal di langkah berikutnya.')}
              type="button"
            >
              Jadwalkan survey
            </button>
            <button
              className="rounded-full bg-neutral-900 px-5 py-3 text-sm font-black text-white transition hover:bg-neutral-700 active:scale-[0.98]"
              onClick={() => setActionStatus('Kontak pemilik kos siap dibuka.')}
              type="button"
            >
              Hubungi pemilik
            </button>
          </div>

          <p className="mt-4 text-center text-sm font-semibold text-neutral-500">{actionStatus}</p>
        </aside>

          <section className="rounded-[2rem] border border-neutral-100 bg-white p-5 shadow-xl shadow-neutral-200/70 sm:p-7 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">Harga sewa dasar</p>
            <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-neutral-900">{formatRupiah(rentalTotal)}</p>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              {selectedRentalPeriod.label}
              {rentalMonths > 1 ? ' • ' + formatRupiah(kos.monthlyPrice) + ' per bulan' : ''}
            </p>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">Durasi sewa</span>
              <select
                className="mt-2 w-full cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                onChange={(event) => setRentalMonths(Number(event.target.value))}
                value={rentalMonths}
              >
                {rentalPeriods.map((period) => (
                  <option key={period.months} value={period.months}>
                    {period.label}
                  </option>
                ))}
              </select>
            </label>

            {rentalMonths > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4 text-sm">
                <span className="font-semibold text-neutral-500">Perhitungan</span>
                <span className="font-black text-neutral-700">
                  {formatRupiah(kos.monthlyPrice)} × {rentalMonths}
                </span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-neutral-200 pt-5">
              <button
                className={
                  'cursor-pointer rounded-xl px-3 py-2.5 text-sm font-black transition ' +
                  (paymentChoice === 'full'
                    ? 'bg-green-600 text-white'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:border-green-300')
                }
                onClick={() => setPaymentChoice('full')}
                type="button"
              >
                Bayar penuh
              </button>
              <button
                className={
                  'cursor-pointer rounded-xl px-3 py-2.5 text-sm font-black transition ' +
                  (paymentChoice === 'dp'
                    ? 'bg-green-600 text-white'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:border-green-300')
                }
                onClick={() => setPaymentChoice('dp')}
                type="button"
              >
                Bayar pakai DP
              </button>
            </div>

            {paymentChoice === 'dp' ? (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm font-bold text-neutral-600">Jika kamu bayar pakai DP:</p>
                <button
                  className="mt-4 flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg p-2 text-left transition hover:bg-neutral-50"
                  onClick={() => setBreakdownType('dp')}
                  type="button"
                >
                  <span className="text-sm font-bold text-neutral-600 underline decoration-neutral-300 underline-offset-4">
                    Uang muka (DP)
                  </span>
                  <span className="shrink-0 text-sm font-black text-neutral-800">{formatRupiah(dpFirstPayment)}</span>
                </button>
                <button
                  className="mt-2 flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg p-2 text-left transition hover:bg-neutral-50"
                  onClick={() => setBreakdownType('settlement')}
                  type="button"
                >
                  <span className="text-sm font-bold text-neutral-600 underline decoration-neutral-300 underline-offset-4">
                    Pelunasan
                  </span>
                  <span className="shrink-0 text-sm font-black text-neutral-800">{formatRupiah(settlementTotal)}</span>
                </button>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-neutral-200 pt-4">
                  <span className="text-sm font-black text-neutral-700">Total sampai lunas</span>
                  <span className="shrink-0 text-sm font-black text-neutral-900">
                    {formatRupiah(dpFirstPayment + settlementTotal)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm font-bold text-neutral-600">Jika kamu melakukan pembayaran penuh:</p>
                <button
                  className="mt-4 flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg p-2 text-left transition hover:bg-neutral-50"
                  onClick={() => setBreakdownType('full')}
                  type="button"
                >
                  <span className="text-sm font-bold text-neutral-600 underline decoration-neutral-300 underline-offset-4">
                    Pembayaran penuh
                  </span>
                  <span className="shrink-0 text-sm font-black text-neutral-800">{formatRupiah(fullPaymentTotal)}</span>
                </button>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-neutral-200 pt-4">
                  <span className="text-sm font-black text-neutral-700">Total pembayaran pertama</span>
                  <span className="shrink-0 text-sm font-black text-neutral-900">{formatRupiah(fullPaymentTotal)}</span>
                </div>
              </div>
            )}
          </div>

          <button
            className="mt-5 w-full rounded-full bg-green-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-green-700 active:scale-[0.98]"
            onClick={() =>
              setRentalStatus(
                `Pengajuan sewa ${selectedRentalPeriod.label.toLowerCase()} dengan metode ${paymentChoice === 'dp' ? 'DP' : 'pembayaran penuh'} telah disiapkan.`,
              )
            }
            type="button"
          >
            Ajukan sewa
          </button>
          <p className="mt-4 text-center text-sm font-semibold leading-6 text-neutral-500">{rentalStatus}</p>
          </section>
        </div>
      </div>

      {activeBreakdown && (
        <PaymentBreakdownModal
          title={activeBreakdown.title}
          lines={activeBreakdown.lines}
          totalLabel={activeBreakdown.totalLabel}
          total={activeBreakdown.total}
          onClose={() => setBreakdownType(null)}
        />
      )}

      {isLightboxOpen && (
        <MediaLightbox
          media={activeMedia}
          title={activeMedia.label + ' — ' + kos.title}
          currentIndex={activeMediaIndex}
          totalCount={mediaItems.length}
          onClose={() => setIsLightboxOpen(false)}
          onPrevious={showPreviousMedia}
          onNext={showNextMedia}
        />
      )}
    </section>
  )
}
