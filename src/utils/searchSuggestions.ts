import type { SearchMetadata, SearchableLocation } from '../types/search'
import { normalizeSearchText } from './normalizeSearchText'

export type SearchSuggestion = SearchableLocation

const cityAliases: Record<string, string[]> = {
  Yogyakarta: ['jogja', 'jogjakarta', 'jogyakarta', 'yogya', 'djogja'],
  Jakarta: ['dki jakarta', 'jakarta raya'],
  Surabaya: ['sby'],
  Bandung: ['bdg'],
  Malang: ['mlg'],
}

const campusAliases: Record<string, string[]> = {
  'Universitas Gadjah Mada': ['ugm'],
  'Universitas Negeri Yogyakarta': ['uny'],
  'Universitas Muhammadiyah Yogyakarta': ['umy'],
  'Universitas Islam Indonesia': ['uii'],
  'Universitas Indonesia': ['ui'],
  'Institut Teknologi Bandung': ['itb'],
  'Universitas Padjadjaran': ['unpad'],
  'Universitas Airlangga': ['unair'],
  'Universitas Brawijaya': ['ub'],
  'Institut Teknologi Sepuluh Nopember': ['its'],
  'IPB University': ['ipb'],
  'BINUS University Kemanggisan': ['binus'],
}

function withAliases(suggestion: SearchSuggestion) {
  return {
    ...suggestion,
    keywords: [
      ...suggestion.keywords,
      ...(cityAliases[suggestion.label] ?? []),
      ...(campusAliases[suggestion.label] ?? []),
    ],
  }
}

function matchScore(suggestion: SearchSuggestion, rawQuery: string) {
  const query = normalizeSearchText(rawQuery)
  const queryWords = query.split(' ').filter(Boolean)
  const searchableValues = [suggestion.label, ...suggestion.keywords].map(normalizeSearchText)

  if (searchableValues.some((item) => item === query)) return 0
  if (searchableValues.some((item) => item.startsWith(query))) return 1
  if (searchableValues.some((item) => item.split(' ').some((word) => word.startsWith(query)))) return 2
  if (searchableValues.some((item) => item.includes(query))) return 3
  if (
    queryWords.length > 1 &&
    searchableValues.some((item) => {
      const itemWords = item.split(' ')
      return queryWords.every((queryWord) =>
        itemWords.some(
          (itemWord) =>
            itemWord.startsWith(queryWord) || queryWord.startsWith(itemWord),
        ),
      )
    })
  ) return 4
  return Number.POSITIVE_INFINITY
}

function createFallbackLocations(metadata: SearchMetadata): SearchSuggestion[] {
  return metadata.cities.flatMap((city) => [
    {
      id: `city-${city.city}`,
      label: city.city,
      description: 'Kota',
      searchValue: city.city,
      keywords: [],
    },
    ...city.areas.map((area) => ({
      id: `area-${city.city}-${area}`,
      label: area,
      description: `Area di ${city.city}`,
      searchValue: area,
      keywords: [city.city],
    })),
    ...city.campuses.map((campus) => ({
      id: `campus-${city.city}-${campus}`,
      label: campus,
      description: `Kampus di ${city.city}`,
      searchValue: campus,
      keywords: [city.city],
    })),
  ])
}

export function getSearchSuggestions(metadata: SearchMetadata, query: string, limit = 8) {
  if (!query.trim()) return []

  const suggestions = (
    metadata.searchableLocations?.length
      ? metadata.searchableLocations
      : createFallbackLocations(metadata)
  ).map(withAliases)

  return suggestions
    .map((suggestion) => ({ suggestion, score: matchScore(suggestion, query) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort(
      (left, right) =>
        left.score - right.score ||
        left.suggestion.label.localeCompare(right.suggestion.label, 'id'),
    )
    .slice(0, limit)
    .map(({ suggestion }) => suggestion)
}
