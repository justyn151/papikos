import { apiRequest } from './apiClient'
import type {
  OwnerContactRequest,
  OwnerRentalRequest,
  OwnerSurveyRequest,
  ListingReviewStatus,
  ListingCompletion,
  CustomFacility,
  CustomRule,
} from './ownerService'
import type { AuthRole, AuthVerificationStatus } from './authService'
import type { KosMedia, PaymentTerms, RentalDuration } from '../types/kos'

export type VerificationStatus = AuthVerificationStatus

export type AdminListing = {
  id: number
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
  facilities: string[]
  customFacilities: CustomFacility[]
  rules: string[]
  customRules: CustomRule[]
  rentalDurations: RentalDuration[]
  paymentTerms: PaymentTerms
  ownerName: string
  ownerEmail: string
  ownerIsActive: boolean
  ownerVerificationStatus: VerificationStatus
  status: ListingReviewStatus
  reviewNotes: string
  completion: ListingCompletion
  updatedAt: string
}

export type AdminUser = {
  id: number
  fullName: string
  phoneNumber: string
  email: string
  role: AuthRole
  isActive: boolean
  verificationStatus: VerificationStatus
  createdAt: string
}

export type AdminDashboard = {
  summary: {
    totalUsers: number
    totalOwners: number
    totalListings: number
    pendingListings: number
    openRequests: number
  }
  listings: AdminListing[]
  users: AdminUser[]
  requests: {
    surveys: OwnerSurveyRequest[]
    contacts: OwnerContactRequest[]
    rentals: OwnerRentalRequest[]
  }
}

export function getAdminDashboard() {
  return apiRequest<AdminDashboard>('/admin/dashboard')
}

export function reviewAdminListing(
  listingId: number,
  payload: { status: ListingReviewStatus; reviewNotes: string },
) {
  return apiRequest<{ listing: AdminListing }>(`/admin/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function updateAdminUser(
  userId: number,
  payload: { isActive: boolean; verificationStatus: VerificationStatus },
) {
  return apiRequest<{ user: AdminUser }>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
