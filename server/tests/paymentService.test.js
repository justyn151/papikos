import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatePaymentQuote } from '../services/paymentCalculator.js'

const listing = {
  id: 101,
  monthlyPrice: 1_000_000,
  paymentTerms: {
    dpPercentage: 30,
    serviceFee: 25_000,
    adminFee: 10_000,
    deposit: 100_000,
    discountPercentage: 10,
  },
}

test('full quote line items add up to its authoritative total', () => {
  const quote = calculatePaymentQuote(listing, { rentalMonths: 3, paymentMethod: 'full' })
  assert.equal(quote.total, 2_835_000)
  assert.equal(quote.lineItems.reduce((sum, item) => sum + item.amount, 0), quote.total)
})

test('DP quote applies only the proportional discount once', () => {
  const quote = calculatePaymentQuote(listing, { rentalMonths: 3, paymentMethod: 'dp' })
  assert.equal(quote.total, 945_000)
  assert.equal(quote.lineItems.reduce((sum, item) => sum + item.amount, 0), quote.total)
})

test('quote rejects non-positive rental periods', () => {
  assert.throws(
    () => calculatePaymentQuote(listing, { rentalMonths: 0, paymentMethod: 'full' }),
    /Durasi sewa belum valid/,
  )
})
