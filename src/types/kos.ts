export type FacilityCategory = {
  id: string
  title: string
  items: string[]
}

export type PaymentTerms = {
  dpPercentage: number
  serviceFee: number
  adminFee: number
  deposit: number
  discountPercentage: number
}

export type KosMedia = {
  id: string
  category: string
  label: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  alt: string
}

export type RentalDuration = 'Bulanan' | '3 Bulan' | '6 Bulan' | 'Tahunan'

export type KosListing = {
  id: number
  title: string
  location: string
  monthlyPrice: number
  rating: number
  tag: string
  address: string
  description: string
  facilities: string[]
  facilityCategories: FacilityCategory[]
  rules: string[]
  roomSize: string
  availableRooms: number
  rentalDurations: RentalDuration[]
  owner: string
  paymentTerms: PaymentTerms
  imageUrl: string
  imageAlt: string
  media: KosMedia[]
}
