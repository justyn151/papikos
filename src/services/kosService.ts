import { allKosListings, featuredKosListings } from '../data/kosListings'
import {
  dummyKosSearchRecords,
  searchMetadata,
} from '../data/searchData'
import type { KosListing } from '../types/kos'
import type {
  KosSearchFilters,
  KosSearchResult,
  SearchCoordinates,
  SearchMetadata,
} from '../types/search'
import { getNormalizedSearchCandidates, normalizeSearchText } from '../utils/normalizeSearchText'
import { getFuzzyTextScore } from '../utils/searchSuggestions'
import { apiBaseUrl, apiRequest } from './apiClient'

export type SearchKosRequest = {
  query: string
  filters: KosSearchFilters
  coordinates?: SearchCoordinates
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

function getDistanceInKilometers(
  first: SearchCoordinates,
  second: SearchCoordinates,
) {
  const earthRadius = 6371
  const degreesToRadians = Math.PI / 180
  const latitudeDistance = (second.lat - first.lat) * degreesToRadians
  const longitudeDistance = (second.lng - first.lng) * degreesToRadians
  const firstLatitude = first.lat * degreesToRadians
  const secondLatitude = second.lat * degreesToRadians

  const haversine =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDistance / 2) ** 2

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function sortSearchResults(results: KosSearchResult[], sort: KosSearchFilters['sort']) {
  return [...results].sort((left, right) => {
    if (sort === 'price-asc') return left.record.monthlyPrice - right.record.monthlyPrice
    if (sort === 'price-desc') return right.record.monthlyPrice - left.record.monthlyPrice
    return (
      Number(right.listing.availableRooms > 0) - Number(left.listing.availableRooms > 0) ||
      right.listing.rating - left.listing.rating ||
      left.record.id - right.record.id
    )
  })
}

const mockKosService: KosService = {
  async getFeatured() {
    return featuredKosListings
  },

  async getById(id) {
    return allKosListings.find((listing) => listing.id === id) ?? null
  },

  async search({ query, filters, coordinates }) {
    const normalizedQueryCandidates = getNormalizedSearchCandidates(query)

    const results = dummyKosSearchRecords.flatMap((record) => {
      const listing = allKosListings.find(
        (candidate) => candidate.id === record.listingId,
      )
      if (!listing) return []

      const searchableText = [
        record.name,
        record.city,
        record.area,
        record.address,
        ...record.nearbyCampuses,
        listing.title,
        listing.location,
        listing.description,
        ...listing.facilities,
        ...listing.facilityCategories.flatMap((category) => category.items),
      ]
        .join(' ')
      const normalizedSearchableText = normalizeSearchText(searchableText)
      const fuzzyScore = getFuzzyTextScore(query, [searchableText])

      if (
        (!coordinates &&
          normalizedQueryCandidates.length > 0 &&
          !normalizedQueryCandidates.some((candidate) =>
            normalizedSearchableText.includes(candidate),
          ) && !Number.isFinite(fuzzyScore)) ||
        !matchesFilters(listing, filters)
      ) return []

      return [{ record, listing }]
    })

    if (!coordinates) return sortSearchResults(results, filters.sort)

    return results
      .map((result) => ({
        ...result,
        distance: getDistanceInKilometers(coordinates, result.record.coordinates),
      }))
      .filter((result) => result.distance <= 25)
      .sort((left, right) => left.distance - right.distance)
      .map((result) => ({
        record: result.record,
        listing: result.listing,
      }))
  },

  async getSearchMetadata() {
    return searchMetadata
  },
}

function createRemoteKosService(): KosService {
  return {
    getFeatured: () => apiRequest<KosListing[]>('/kos?featured=true'),
    getById: (id) => apiRequest<KosListing | null>(`/kos/${id}`),
    search: ({ query, filters, coordinates }) => {
      const params = new URLSearchParams({
        query,
        availableOnly: String(filters.availableOnly),
        sort: filters.sort,
      })
      if (filters.tags.length > 0) params.set('tags', filters.tags.join(','))
      if (filters.duration) params.set('duration', filters.duration)
      if (filters.minPrice !== null) params.set('minPrice', String(filters.minPrice))
      if (filters.maxPrice !== null) params.set('maxPrice', String(filters.maxPrice))
      if (filters.facilities.length > 0) {
        params.set('facilities', filters.facilities.join(','))
      }
      if (filters.rules.length > 0) params.set('rules', filters.rules.join(','))
      if (coordinates) {
        params.set('lat', String(coordinates.lat))
        params.set('lng', String(coordinates.lng))
      }
      return apiRequest<KosSearchResult[]>(`/kos/search?${params}`)
    },
    getSearchMetadata: () => apiRequest<SearchMetadata>('/search/metadata'),
  }
}

export const kosService: KosService = apiBaseUrl
  ? createRemoteKosService()
  : mockKosService
