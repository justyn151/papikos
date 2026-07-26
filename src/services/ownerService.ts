import { ApiError, apiBaseUrl, apiRequest } from './apiClient'
import type { KosMedia, PaymentTerms, RentalDuration } from '../types/kos'

export type ListingReviewStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived'

export type CustomFacility = {
  id?: number
  category: string
  name: string
}

export type CustomRule = {
  id?: number
  name: string
}

export type OwnerListingInput = {
  title: string
  city: string
  monthlyPrice: number
  tag: string
  address: string
  addressNotes: string
  description: string
  roomTypeName: string
  roomSize: string
  totalRooms: number
  availableRooms: number
  imageUrl: string
  imageAlt: string
  latitude: number | null
  longitude: number | null
  media: KosMedia[]
  facilityIds: number[]
  ruleIds: number[]
  customFacilities: CustomFacility[]
  customRules: CustomRule[]
  rentalDurations: RentalDuration[]
  paymentTerms: PaymentTerms
}

export type ListingCompletion = {
  percent: number
  completed: number
  total: number
  missing: string[]
}

export type OwnerListing = OwnerListingInput & {
  id: number
  status: ListingReviewStatus
  reviewNotes: string
  completion: ListingCompletion
  lastInventoryUpdate: string
  updatedAt: string
}

export type FacilityOption = {
  id: number
  name: string
  categoryId: string
  categoryTitle: string
}

export type RuleOption = {
  id: number
  name: string
}

type OwnerRequest = {
  id: number
  kos_id: number
  kos_title: string
  renter_name: string
  phone_number: string
  email: string
  status: string
  created_at: string
}

export type OwnerSurveyRequest = OwnerRequest & {
  scheduled_for: string
  visitor_type: 'self' | 'representative'
  visitor_name: string
  visitor_phone: string
  relationship: string
  notes: string
}

export type OwnerContactRequest = OwnerRequest & {
  message: string
  preferred_contact_method: 'chat' | 'whatsapp' | 'phone'
}

export type OwnerRentalRequest = OwnerRequest & {
  rental_months: number
  payment_method: string
  quoted_total: number
  move_in_date: string
  notes: string
}

export type OwnerDashboard = {
  summary: {
    totalListings: number
    publishedListings: number
    availableRooms: number
    openRequests: number
  }
  listings: OwnerListing[]
  setupOptions: {
    facilities: FacilityOption[]
    rules: RuleOption[]
  }
  surveys: OwnerSurveyRequest[]
  contacts: OwnerContactRequest[]
  rentals: OwnerRentalRequest[]
}

export function getOwnerDashboard() {
  return apiRequest<OwnerDashboard>('/owner/dashboard')
}

export function createOwnerListing(payload: OwnerListingInput) {
  return apiRequest<{ listing: OwnerListing }>('/owner/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function uploadOwnerMedia(file: File) {
  if (!apiBaseUrl) throw new ApiError('VITE_API_BASE_URL belum dikonfigurasi.', 0)
  const body = new FormData()
  body.append('file', file)
  const response = await fetch(`${apiBaseUrl}/owner/media`, {
    method: 'POST',
    body,
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    let message = `Upload foto gagal dengan status ${response.status}.`
    try {
      const error = await response.json() as { message?: string }
      message = error.message ?? message
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new ApiError(message, response.status)
  }
  const result = await response.json() as {
    media: { url: string; originalName: string; mediaType: 'image' | 'video' }
  }
  return {
    ...result.media,
    url: `${apiBaseUrl}${result.media.url}`,
  }
}

export function updateOwnerListing(listingId: number, payload: OwnerListingInput) {
  return apiRequest<{ listing: OwnerListing }>(`/owner/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function submitOwnerListing(listingId: number) {
  return apiRequest<{ listing: OwnerListing }>(`/owner/listings/${listingId}/submit`, {
    method: 'POST',
  })
}

export function updateOwnerAvailability(listingId: number, availableRooms: number) {
  return apiRequest<{ listing: OwnerListing }>(`/owner/listings/${listingId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ availableRooms }),
  })
}

export function updateOwnerRequest(
  type: 'surveys' | 'contacts' | 'rentals',
  id: number,
  status: string,
) {
  return apiRequest(`/owner/requests/${type}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
