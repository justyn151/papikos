import { calculatePaymentQuote } from './paymentCalculator.js'
import { getListingById } from './kosRepository.js'

export async function createPaymentQuote(kosId, body) {
  return calculatePaymentQuote(await getListingById(kosId), body)
}

