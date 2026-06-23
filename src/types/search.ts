import type { KosListing, RentalDuration } from './kos'

export type SearchCity = {
  city: string
  campuses: string[]
  areas: string[]
}

export type KosSearchRecord = {
  id: number
  listingId: KosListing['id']
  name: string
  city: string
  area: string
  address: string
  nearbyCampuses: string[]
  coordinates: {
    lat: number
    lng: number
  }
  monthlyPrice: number
  tag: 'Putra' | 'Putri' | 'Campur'
}

export type KosSearchFilters = {
  tags: string[]
  duration: RentalDuration | null
  minPrice: number | null
  maxPrice: number | null
  facilities: string[]
  rules: string[]
  availableOnly: boolean
}

export type KosSearchResult = {
  record: KosSearchRecord
  listing: KosListing
}

export type SearchMetadata = {
  cities: SearchCity[]
  popularCampuses: string[]
}
