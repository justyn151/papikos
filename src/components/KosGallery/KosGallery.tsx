import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { PointerEvent as ReactPointerEvent, TransitionEvent as ReactTransitionEvent } from 'react'
import type { KosListing } from '../../types/kos'
import { formatRupiah } from '../../utils/formatCurrency'

type KosGalleryProps = {
  listings: KosListing[]
  onShowDetail: (kos: KosListing) => void
}

type SlideDirection = 'next' | 'previous' | 'reset' | null

function getWrappedIndex(index: number, length: number) {
  return ((index % length) + length) % length
}

export function KosGallery({ listings, onShowDetail }: KosGalleryProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef(0)
  const dragOffsetRef = useRef(0)
  const lastPointerRef = useRef({ x: 0, time: 0 })
  const velocityRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedKosTitle, setSelectedKosTitle] = useState('Pilih salah satu kos untuk lihat detailnya.')
  const [baseOffset, setBaseOffset] = useState(0)
  const [slideStep, setSlideStep] = useState(846)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [pendingDirection, setPendingDirection] = useState<SlideDirection>(null)
  const [emphasizedCardIndex, setEmphasizedCardIndex] = useState(2)

  const visibleSlides = [-2, -1, 0, 1, 2].map((offset) => {
    const logicalIndex = activeIndex + offset
    return {
      logicalIndex,
      listing: listings[getWrappedIndex(logicalIndex, listings.length)],
    }
  })
  const currentOffset = baseOffset + dragOffset

  useEffect(() => {
    function measureCarousel() {
      const viewport = viewportRef.current
      const track = trackRef.current
      const firstCard = track?.firstElementChild

      if (!viewport || !track || !(firstCard instanceof HTMLElement)) return

      const styles = window.getComputedStyle(track)
      const gap = Number.parseFloat(styles.columnGap || styles.gap || '0')
      const cardWidth = firstCard.offsetWidth
      const step = cardWidth + gap

      setSlideStep(step)
      setBaseOffset((viewport.getBoundingClientRect().width - cardWidth) / 2 - step * 2)
    }

    const frame = requestAnimationFrame(measureCarousel)
    window.addEventListener('resize', measureCarousel)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measureCarousel)
    }
  }, [])

  function animateTo(direction: Exclude<SlideDirection, null>, startOffset = 0) {
    if (pendingDirection) return

    setShouldAnimate(false)
    updateDragOffset(startOffset)

    requestAnimationFrame(() => {
      setShouldAnimate(true)
      setPendingDirection(direction)

      if (direction === 'next') {
        setEmphasizedCardIndex(3)
        updateDragOffset(-slideStep)
        return
      }

      if (direction === 'previous') {
        setEmphasizedCardIndex(1)
        updateDragOffset(slideStep)
        return
      }

      setEmphasizedCardIndex(2)
      updateDragOffset(0)
    })
  }

  function showPrevious() {
    animateTo('previous')
  }

  function showNext() {
    animateTo('next')
  }

  function handleTransitionEnd(event: ReactTransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return

    const completedDirection = pendingDirection

    flushSync(() => {
      setShouldAnimate(false)
    })

    flushSync(() => {
      if (completedDirection === 'next') {
        setActiveIndex((currentIndex) => currentIndex + 1)
      }

      if (completedDirection === 'previous') {
        setActiveIndex((currentIndex) => currentIndex - 1)
      }

      dragOffsetRef.current = 0
      setDragOffset(0)
      setEmphasizedCardIndex(2)
      setPendingDirection(null)
    })
  }

  function updateDragOffset(nextOffset: number) {
    dragOffsetRef.current = nextOffset
    setDragOffset(nextOffset)
  }

  function startDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    if (pendingDirection) return

    dragStartRef.current = event.clientX
    lastPointerRef.current = { x: event.clientX, time: performance.now() }
    velocityRef.current = 0
    setIsDragging(true)
    setShouldAnimate(false)
    updateDragOffset(0)
    window.addEventListener('pointermove', dragCarousel)
    window.addEventListener('pointerup', stopDragging, { once: true })
    window.addEventListener('pointercancel', stopDragging, { once: true })
  }

  function dragCarousel(event: PointerEvent) {
    const now = performance.now()
    const elapsed = Math.max(now - lastPointerRef.current.time, 1)
    velocityRef.current = (event.clientX - lastPointerRef.current.x) / elapsed
    lastPointerRef.current = { x: event.clientX, time: now }

    const distance = event.clientX - dragStartRef.current
    const clampedDistance = Math.max(Math.min(distance, slideStep * 1.15), -slideStep * 1.15)
    updateDragOffset(clampedDistance)
  }

  function stopDragging() {
    window.removeEventListener('pointermove', dragCarousel)
    window.removeEventListener('pointerup', stopDragging)
    window.removeEventListener('pointercancel', stopDragging)
    setIsDragging(false)
    const threshold = Math.min(slideStep * 0.18, 120)
    const releasedOffset = dragOffsetRef.current
    const projectedOffset = releasedOffset + velocityRef.current * 180

    if (Math.abs(releasedOffset) < 2 && Math.abs(velocityRef.current) < 0.02) {
      setShouldAnimate(false)
      setPendingDirection(null)
      updateDragOffset(0)
      return
    }

    if (projectedOffset <= -threshold) {
      animateTo('next', releasedOffset)
      return
    }

    if (projectedOffset >= threshold) {
      animateTo('previous', releasedOffset)
      return
    }

    animateTo('reset', releasedOffset)
  }

  function renderCard(listing: KosListing, index: number, logicalIndex: number) {
    const isActiveCard = index === 2
    const isEmphasized = index === emphasizedCardIndex
    const discountPercentage = listing.paymentTerms.discountPercentage
    const discountedMonthlyPrice = Math.round(
      listing.monthlyPrice * (1 - discountPercentage / 100),
    )
    return (
      <article
        className={
          'group relative h-[220px] w-[min(84vw,680px)] shrink-0 overflow-hidden rounded-lg bg-neutral-100 transition-[transform,opacity,box-shadow] duration-500 ease-out sm:h-[260px] lg:h-[282px] ' +
          (isEmphasized
            ? 'z-20 opacity-100 shadow-2xl shadow-neutral-300/80'
            : 'z-0 opacity-75 shadow-lg shadow-neutral-200/60')
        }
        key={logicalIndex}
        style={{ transform: isEmphasized ? 'translateZ(35px)' : 'translateZ(-55px)' }}
      >
        <img
          className="h-full w-full select-none object-cover transition duration-500 group-hover:scale-105"
          src={listing.imageUrl}
          alt={listing.imageAlt}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/75" />

        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-green-700 backdrop-blur">
            {listing.tag}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">⭐ {listing.rating}</span>
            <span>{listing.location}</span>
          </div>
          <h3 className="max-w-xl text-2xl font-black leading-none tracking-[-0.04em] sm:text-3xl">{listing.title}</h3>
          <div className="mt-2 flex min-h-7 flex-wrap items-center gap-2 text-xs font-black">
            {discountPercentage > 0 && (
              <>
              <span className="rounded-full bg-red-500 px-2.5 py-1 text-white">⚡ Diskon {discountPercentage}%</span>
              <span className="text-white/65 line-through">{formatRupiah(listing.monthlyPrice)}</span>
              </>
            )}
          </div>
          <p className="mt-2 text-base font-black text-white sm:text-lg">
            {formatRupiah(discountPercentage > 0 ? discountedMonthlyPrice : listing.monthlyPrice)} / bulan
          </p>

          <button
            className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-black text-green-700 transition hover:bg-green-50 active:scale-[0.98]"
            onClick={() => {
              onShowDetail(listing)
              setSelectedKosTitle(listing.title + ': membuka halaman detail.')
            }}
            tabIndex={isActiveCard ? 0 : -1}
            type="button"
          >
            Lihat detail
          </button>
        </div>
      </article>
    )
  }

  return (
    <section className="w-full min-w-0 overflow-hidden px-4 pb-14 pt-4 select-none sm:px-8 lg:px-[86px]" aria-label="Foto kos pilihan">
      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-green-600">Rekomendasi kos</p>
          <h2 className="mt-1 max-w-full break-words text-[22px] font-black leading-tight tracking-[-0.04em] text-neutral-800 sm:text-3xl">
            Foto kos asli yang bisa kamu jelajahi
          </h2>
          <p className="mt-2 max-w-full break-words text-sm font-semibold text-neutral-500">{selectedKosTitle}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            className="grid size-11 place-items-center rounded-full border border-neutral-200 bg-white text-xl font-black text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-95"
            onClick={showPrevious}
            type="button"
            aria-label="Show previous kos"
          >
            ←
          </button>
          <button
            className="grid size-11 place-items-center rounded-full border border-neutral-200 bg-white text-xl font-black text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-95"
            onClick={showNext}
            type="button"
            aria-label="Show next kos"
          >
            →
          </button>
        </div>
      </div>

      <div className="overflow-hidden [perspective:1600px]" ref={viewportRef}>
        <div
          className={
            'flex gap-6 [transform-style:preserve-3d] lg:gap-[92px] ' +
            (isDragging ? 'cursor-grabbing ' : 'cursor-grab ') +
            (shouldAnimate ? 'transition-transform duration-500 ease-out' : '')
          }
          ref={trackRef}
          onPointerDown={startDragging}
          onTransitionEnd={handleTransitionEnd}
          style={{ transform: 'translate3d(' + currentOffset + 'px, 0, 0)' }}
        >
          {visibleSlides.map(({ listing, logicalIndex }, index) => renderCard(listing, index, logicalIndex))}
        </div>
      </div>
    </section>
  )
}
