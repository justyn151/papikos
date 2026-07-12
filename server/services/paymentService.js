import { validationError } from '../errors.js'
import { getListingById } from './kosRepository.js'

function roundRupiah(value) {
  return Math.max(0, Math.round(value))
}

export async function createPaymentQuote(kosId, body) {
  const listing = await getListingById(kosId)
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
  const payableRent = subtotal - discount
  const baseFirstPayment =
    paymentMethod === 'dp'
      ? roundRupiah(payableRent * (terms.dpPercentage / 100))
      : payableRent
  const total = roundRupiah(baseFirstPayment + terms.adminFee + terms.deposit + terms.serviceFee)

  return {
    kosId: listing.id,
    rentalMonths,
    paymentMethod,
    lineItems: [
      {
        label: paymentMethod === 'dp' ? 'Uang muka (DP)' : 'Pembayaran penuh',
        amount: baseFirstPayment,
      },
      { label: 'Biaya admin', amount: terms.adminFee },
      { label: 'Deposit', amount: terms.deposit },
      { label: 'Biaya layanan Papikos', amount: terms.serviceFee },
      { label: `Diskon ${terms.discountPercentage}%`, amount: -discount },
    ].filter((item) => item.amount !== 0),
    total,
  }
}

