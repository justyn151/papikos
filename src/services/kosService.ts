import type { KosListing } from '../types/kos'
import type {
  KosSearchFilters,
  KosSearchResult,
  SearchMetadata,
} from '../types/search'
import { apiRequest } from './apiClient'

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

export const kosService: KosService = {
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

