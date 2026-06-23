import { useEffect, useState } from 'react'
import type { AnimationEvent } from 'react'
import { formatRupiah } from '../../utils/formatCurrency'

export type PaymentBreakdownLine = {
  label: string
  amount: number
  isDiscount?: boolean
}

type PaymentBreakdownModalProps = {
  title: string
  lines: PaymentBreakdownLine[]
  totalLabel: string
  total: number
  onClose: () => void
}

export function PaymentBreakdownModal({
  title,
  lines,
  totalLabel,
  total,
  onClose,
}: PaymentBreakdownModalProps) {
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
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        requestClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={requestClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-breakdown-title"
      style={{
        animation: isClosing
          ? 'payment-backdrop-out 180ms ease-in both'
          : 'payment-backdrop-in 180ms ease-out both',
      }}
    >
      <section
        className="w-full max-w-xl rounded-[2rem] bg-white p-5 shadow-2xl sm:p-8"
        onAnimationEnd={finishClosing}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          animation: isClosing
            ? 'payment-modal-out 180ms ease-in both'
            : 'payment-modal-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="payment-breakdown-title" className="text-2xl font-black tracking-[-0.04em] text-neutral-900 sm:text-3xl">
            {title}
          </h2>
          <button
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-neutral-100 text-2xl text-neutral-500 transition hover:bg-neutral-200"
            onClick={requestClose}
            type="button"
            aria-label="Tutup rincian pembayaran"
          >
            ×
          </button>
        </div>

        <dl className="mt-8 space-y-4">
          {lines.map((line) => (
            <div className="flex items-start justify-between gap-5" key={line.label}>
              <dt className="text-sm font-semibold text-neutral-600 sm:text-base">{line.label}</dt>
              <dd className={`shrink-0 text-sm font-black sm:text-base ${line.isDiscount ? 'text-green-600' : 'text-neutral-800'}`}>
                {line.isDiscount ? '-' : ''}
                {formatRupiah(Math.abs(line.amount))}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex items-start justify-between gap-5 border-t border-dashed border-neutral-200 pt-6">
          <p className="font-black text-neutral-800">{totalLabel}</p>
          <p className="shrink-0 text-lg font-black text-neutral-900">{formatRupiah(total)}</p>
        </div>

        <p className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-700">
          Rincian ini adalah estimasi frontend. Nominal final harus dikonfirmasi oleh backend sebelum pembayaran.
        </p>
      </section>
    </div>
  )
}
