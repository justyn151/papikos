import { useEffect, useState } from 'react'
import type { AnimationEvent } from 'react'
import type { KosMedia } from '../../types/kos'

type MediaLightboxProps = {
  media: KosMedia
  title: string
  currentIndex: number
  totalCount: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

export function MediaLightbox({
  media,
  title,
  currentIndex,
  totalCount,
  onClose,
  onPrevious,
  onNext,
}: MediaLightboxProps) {
  const [isClosing, setIsClosing] = useState(false)

  function requestClose() {
    setIsClosing(true)
  }

  function finishClosing(event: AnimationEvent<HTMLElement>) {
    if (isClosing && event.target === event.currentTarget) {
      onClose()
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') requestClose()
      if (event.key === 'ArrowLeft') onPrevious()
      if (event.key === 'ArrowRight') onNext()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onNext, onPrevious])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-3 backdrop-blur-sm sm:p-8"
      onMouseDown={requestClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        animation: isClosing
          ? 'payment-backdrop-out 180ms ease-in both'
          : 'payment-backdrop-in 180ms ease-out both',
      }}
    >
      <section
        className="relative flex h-full max-h-[92vh] w-full max-w-7xl flex-col items-center justify-center gap-3"
        onAnimationEnd={finishClosing}
        onMouseDown={requestClose}
        style={{
          animation: isClosing
            ? 'payment-modal-out 180ms ease-in both'
            : 'payment-modal-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <div
          className="rounded-full bg-black/65 px-4 py-2 text-sm font-black text-white backdrop-blur"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {currentIndex + 1} / {totalCount}
        </div>

        <div
          className="relative flex aspect-video max-w-full items-center justify-center overflow-hidden rounded-2xl bg-black shadow-2xl"
          onMouseDown={(event) => event.stopPropagation()}
          style={{ width: 'min(100%, calc(72vh * 16 / 9))' }}
        >
          {media.type === 'video' ? (
            <video
              className="h-full w-full bg-black object-contain"
              controls
              playsInline
              poster={media.thumbnailUrl}
              preload="metadata"
            >
              <source src={media.url} type="video/mp4" />
              Browser kamu belum mendukung pemutar video HTML.
            </video>
          ) : (
            <img
              className="h-full w-full object-contain"
              src={media.url}
              alt={media.alt}
            />
          )}
        </div>

        <button
          className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-neutral-800 shadow-xl backdrop-blur transition hover:scale-105 hover:bg-white sm:left-5 sm:size-14"
          onClick={onPrevious}
          onMouseDown={(event) => event.stopPropagation()}
          type="button"
          aria-label="Lihat gambar sebelumnya"
        >
          ←
        </button>
        <button
          className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-neutral-800 shadow-xl backdrop-blur transition hover:scale-105 hover:bg-white sm:right-5 sm:size-14"
          onClick={onNext}
          onMouseDown={(event) => event.stopPropagation()}
          type="button"
          aria-label="Lihat gambar berikutnya"
        >
          →
        </button>
        <button
          className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-white/90 text-2xl text-neutral-700 shadow-xl backdrop-blur transition hover:scale-105 hover:bg-white sm:right-5 sm:top-5"
          onClick={requestClose}
          onMouseDown={(event) => event.stopPropagation()}
          type="button"
          aria-label="Tutup gambar"
        >
          ×
        </button>

        <div
          className="max-w-[90%] rounded-full bg-black/65 px-5 py-2 text-center text-sm font-bold text-white backdrop-blur"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {title}
        </div>
      </section>
    </div>
  )
}
