import { apiRequest } from './apiClient'

type ActivityBase = { id: number; kos_title: string; status: string; created_at: string }
export type MyActivity = {
  surveys: Array<ActivityBase & { scheduled_for: string; notes: string }>
  contacts: Array<ActivityBase & { message: string }>
  rentals: Array<ActivityBase & { rental_months: number; payment_method: string; quoted_total: number }>
}

export type PaymentQuote = {
  kosId: number
  rentalMonths: number
  paymentMethod: 'full' | 'dp'
  lineItems: Array<{ label: string; amount: number }>
  total: number
}

export function getPaymentQuote(kosId: number, rentalMonths: number, paymentMethod: 'full' | 'dp') {
  return apiRequest<PaymentQuote>(`/kos/${kosId}/payment-quote`, {
    method: 'POST',
    body: JSON.stringify({ rentalMonths, paymentMethod }),
  })
}

export function requestSurvey(kosId: number, scheduledFor: string) {
  return apiRequest(`/kos/${kosId}/surveys`, {
    method: 'POST',
    body: JSON.stringify({ scheduledFor }),
  })
}

export function requestOwnerContact(kosId: number) {
  return apiRequest(`/kos/${kosId}/contact-requests`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export function submitRentalApplication(
  kosId: number,
  rentalMonths: number,
  paymentMethod: 'full' | 'dp',
) {
  return apiRequest(`/kos/${kosId}/rental-applications`, {
    method: 'POST',
    body: JSON.stringify({ rentalMonths, paymentMethod }),
  })
}

export function getMyActivity() {
  return apiRequest<MyActivity>('/me/activity')
}
