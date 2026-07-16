import { apiRequest } from './apiClient'

type OwnerRequest = {
  id: number
  kos_title: string
  renter_name: string
  status: string
  created_at: string
}

export type OwnerInbox = {
  listings: Array<{ id: number; title: string; available_rooms: number }>
  surveys: Array<OwnerRequest & { scheduled_for: string; notes: string }>
  contacts: Array<OwnerRequest & { phone_number: string; message: string }>
  rentals: Array<OwnerRequest & { rental_months: number; payment_method: string; quoted_total: number }>
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
