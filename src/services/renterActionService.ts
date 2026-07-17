import { apiRequest } from './apiClient'

type ActivityBase = { id: number; kos_title: string; status: string; created_at: string }
export type MyActivity = {
  surveys: Array<ActivityBase & {
    scheduled_for: string
    visitor_type: 'self' | 'representative'
    visitor_name: string
    visitor_phone: string
    relationship: string
    notes: string
  }>
  contacts: Array<ActivityBase & {
    message: string
    preferred_contact_method: 'chat' | 'whatsapp' | 'phone'
  }>
  rentals: Array<ActivityBase & {
    rental_months: number
    payment_method: string
    quoted_total: number
    move_in_date: string
    notes: string
  }>
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

export type SurveyRequestPayload = {
  scheduledFor: string
  visitorType: 'self' | 'representative'
  representativeName?: string
  representativePhone?: string
  relationship?: string
  notes?: string
}

export type ContactRequestPayload = {
  message: string
  preferredContactMethod: 'chat' | 'whatsapp' | 'phone'
}

export type RentalApplicationPayload = {
  rentalMonths: number
  paymentMethod: 'full' | 'dp'
  moveInDate: string
  notes?: string
}

export function requestSurvey(kosId: number, payload: SurveyRequestPayload) {
  return apiRequest(`/kos/${kosId}/surveys`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestOwnerContact(kosId: number, payload: ContactRequestPayload) {
  return apiRequest(`/kos/${kosId}/contact-requests`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitRentalApplication(kosId: number, payload: RentalApplicationPayload) {
  return apiRequest(`/kos/${kosId}/rental-applications`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getMyActivity() {
  return apiRequest<MyActivity>('/me/activity')
}
