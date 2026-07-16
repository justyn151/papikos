import { validationError } from '../errors.js'

function roundRupiah(value) {
  return Math.max(0, Math.round(value))
}

export function calculatePaymentQuote(listing, body) {
  const rentalMonths = Number(body.rentalMonths ?? 1)
  const paymentMethod = body.paymentMethod === 'dp' ? 'dp' : 'full'

  if (!Number.isInteger(rentalMonths) || rentalMonths <= 0) {
    throw validationError('Durasi sewa belum valid.', {
      rentalMonths: 'Durasi sewa harus berupa angka bulan lebih dari 0.',
    })
  }

  const terms = listing.paymentTerms
  const subtotal = listing.monthlyPrice * rentalMonths
  const discount = roundRupiah(subtotal * (terms.discountPercentage / 100))
  const baseBeforeDiscount = paymentMethod === 'dp'
    ? roundRupiah(subtotal * (terms.dpPercentage / 100))
    : subtotal
  const appliedDiscount = paymentMethod === 'dp'
    ? roundRupiah(discount * (terms.dpPercentage / 100))
    : discount
  const total = roundRupiah(
    baseBeforeDiscount - appliedDiscount + terms.adminFee + terms.deposit + terms.serviceFee,
  )

  return {
    kosId: listing.id,
    rentalMonths,
    paymentMethod,
    lineItems: [
      { label: paymentMethod === 'dp' ? 'Uang muka (DP)' : 'Pembayaran penuh', amount: baseBeforeDiscount },
      { label: 'Biaya admin', amount: terms.adminFee },
      { label: 'Deposit', amount: terms.deposit },
      { label: 'Biaya layanan Papikos', amount: terms.serviceFee },
      { label: `Diskon ${terms.discountPercentage}%`, amount: -appliedDiscount },
    ].filter((item) => item.amount !== 0),
    total,
  }
}
