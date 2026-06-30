import { allKosListings, featuredKosListings } from '../data/kosListings'
import {
  dummyKosSearchRecords,
  searchMetadata,
} from '../data/searchData'
import type { KosListing } from '../types/kos'
import type {
  KosSearchFilters,
  KosSearchResult,
  SearchMetadata,
} from '../types/search'
import { apiBaseUrl, apiRequest } from './apiClient'

export type SearchKosRequest = {
  query: string
  filters: KosSearchFilters
}

export interface KosService {
  getFeatured(): Promise<KosListing[]>
  getById(id: KosListing['id']): Promise<KosListing | null>
  search(request: SearchKosRequest): Promise<KosSearchResult[]>
  getSearchMetadata(): Promise<SearchMetadata>
}

function matchesFilters(listing: KosListing, filters: KosSearchFilters) {
  const allFacilities = [
    ...listing.facilities,
    ...listing.facilityCategories.flatMap((category) => category.items),
  ]
  const searchableRules = [...listing.rules, ...allFacilities].map((item) =>
    item.toLocaleLowerCase('id-ID'),
  )

  if (filters.tags.length > 0 && !filters.tags.includes(listing.tag)) return false
  if (filters.duration && !listing.rentalDurations.includes(filters.duration)) return false
  if (filters.minPrice !== null && listing.monthlyPrice < filters.minPrice) return false
  if (filters.maxPrice !== null && listing.monthlyPrice > filters.maxPrice) return false
  if (
    filters.facilities.length > 0 &&
    !filters.facilities.every((facility) => allFacilities.includes(facility))
  ) return false
  if (
    filters.rules.length > 0 &&
    !filters.rules.every((rule) =>
      searchableRules.some((listingRule) => listingRule.includes(rule)),
    )
  ) return false
  return !filters.availableOnly || listing.availableRooms > 0
}

const mockKosService: KosService = {
  async getFeatured() {
    return featuredKosListings
  },

  async getById(id) {
    return allKosListings.find((listing) => listing.id === id) ?? null
  },

  async search({ query, filters }) {
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')

    return dummyKosSearchRecords.flatMap((record) => {
      const searchableText = [
        record.name,
        record.city,
        record.area,
        record.address,
        ...record.nearbyCampuses,
      ]
        .join(' ')
        .toLocaleLowerCase('id-ID')
      const listing = allKosListings.find(
        (candidate) => candidate.id === record.listingId,
      )

      if (
        !listing ||
        !searchableText.includes(normalizedQuery) ||
        !matchesFilters(listing, filters)
      ) return []

      return [{ record, listing }]
    })
  },

  async getSearchMetadata() {
    return searchMetadata
  },
}

function createRemoteKosService(): KosService {
  return {
    getFeatured: () => apiRequest<KosListing[]>('/kos?featured=true'),
    getById: (id) => apiRequest<KosListing | null>(`/kos/${id}`),
    search: ({ query, filters }) => {
      const params = new URLSearchParams({
        query,
        tags: filters.tags.join(','),
        duration: filters.duration ?? '',
        minPrice: filters.minPrice?.toString() ?? '',
        maxPrice: filters.maxPrice?.toString() ?? '',
        facilities: filters.facilities.join(','),
        rules: filters.rules.join(','),
        availableOnly: String(filters.availableOnly),
      })
      return apiRequest<KosSearchResult[]>(`/kos/search?${params}`)
    },
    getSearchMetadata: () => apiRequest<SearchMetadata>('/search/metadata'),
  }
}

export const kosService: KosService = apiBaseUrl
  ? createRemoteKosService()
  : mockKosService
