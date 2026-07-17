import { apiRequest } from './apiClient'

type OwnerRequest = {
  id: number
  kos_title: string
  renter_name: string
  phone_number: string
  email: string
  status: string
  created_at: string
}

export type OwnerInbox = {
  listings: Array<{ id: number; title: string; available_rooms: number }>
  surveys: Array<OwnerRequest & {
    scheduled_for: string
    visitor_type: 'self' | 'representative'
    visitor_name: string
    visitor_phone: string
    relationship: string
    notes: string
  }>
  contacts: Array<OwnerRequest & {
    message: string
    preferred_contact_method: 'chat' | 'whatsapp' | 'phone'
  }>
  rentals: Array<OwnerRequest & {
    rental_months: number
    payment_method: string
    quoted_total: number
    move_in_date: string
    notes: string
  }>
}

export function getOwnerInbox() {
  return apiRequest<OwnerInbox>('/owner/inbox')
}

export function updateOwnerRequest(type: 'surveys' | 'contacts' | 'rentals', id: number, status: string) {
  return apiRequest(`/owner/requests/${type}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
