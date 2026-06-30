import type {
  KosSearchRecord,
  SearchableLocation,
  SearchCity,
  SearchMetadata,
} from '../types/search'
import { indonesiaAdministrativeLocations } from './indonesiaLocations'

export const searchCities: SearchCity[] = [
  {
    city: 'Bali',
    campuses: ['Universitas Udayana', 'Institut Seni Indonesia Denpasar'],
    areas: ['Denpasar', 'Jimbaran', 'Kuta'],
  },
  {
    city: 'Bandung',
    campuses: [
      'Institut Teknologi Bandung',
      'Universitas Padjadjaran',
      'Universitas Pendidikan Indonesia',
      'Telkom University',
    ],
    areas: ['Dago', 'Dipatiukur', 'Buah Batu', 'Sukajadi', 'Jatinangor'],
  },
  {
    city: 'Bogor',
    campuses: ['IPB University', 'Universitas Pakuan'],
    areas: ['Dramaga', 'Baranangsiang', 'Bogor Tengah', 'Sentul'],
  },
  {
    city: 'Depok',
    campuses: [
      'Universitas Indonesia',
      'Politeknik Negeri Jakarta',
      'Universitas Gunadarma',
    ],
    areas: ['Margonda', 'Beji', 'Kukusan', 'Pondok Cina'],
  },
  {
    city: 'Jakarta',
    campuses: [
      'BINUS University Kemanggisan',
      'Universitas Negeri Jakarta',
      'Universitas Trisakti',
      'UIN Syarif Hidayatullah Jakarta',
    ],
    areas: ['Tebet', 'Kuningan', 'Kemang', 'Rawamangun', 'Kemanggisan'],
  },
  {
    city: 'Malang',
    campuses: [
      'Universitas Brawijaya',
      'Universitas Negeri Malang',
      'Universitas Muhammadiyah Malang',
    ],
    areas: ['Lowokwaru', 'Dinoyo', 'Tlogomas', 'Sumbersari'],
  },
  {
    city: 'Surabaya',
    campuses: [
      'Universitas Airlangga',
      'Institut Teknologi Sepuluh Nopember',
      'UPN Veteran Jawa Timur',
    ],
    areas: ['Mulyorejo', 'Sukolilo', 'Rungkut', 'Keputih'],
  },
  {
    city: 'Yogyakarta',
    campuses: [
      'Universitas Gadjah Mada',
      'Universitas Negeri Yogyakarta',
      'Universitas Islam Indonesia',
      'Universitas Muhammadiyah Yogyakarta',
    ],
    areas: ['Kaliurang', 'Seturan', 'Gejayan', 'Pogung', 'Babarsari'],
  },
]

export const popularCampusSearches = [
  'Universitas Gadjah Mada',
  'Universitas Indonesia',
  'Institut Teknologi Bandung',
  'Universitas Padjadjaran',
  'Universitas Airlangga',
  'Universitas Brawijaya',
  'Universitas Negeri Yogyakarta',
  'IPB University',
]

export const dummyKosSearchRecords: KosSearchRecord[] = [
  {
    id: 1,
    listingId: 101,
    name: 'Kos Putri Pogung Nyaman',
    city: 'Yogyakarta',
    area: 'Pogung',
    address: 'Pogung, Sinduadi, Mlati, Sleman, DI Yogyakarta',
    nearbyCampuses: ['Universitas Gadjah Mada'],
    coordinates: { lat: -7.7652, lng: 110.3724 },
    monthlyPrice: 950000,
    tag: 'Putri',
  },
  {
    id: 2,
    listingId: 102,
    name: 'Kos Campur Kaliurang Residence',
    city: 'Yogyakarta',
    area: 'Kaliurang',
    address: 'Jl. Kaliurang KM 5, Caturtunggal, Sleman, DI Yogyakarta',
    nearbyCampuses: ['Universitas Gadjah Mada', 'Universitas Negeri Yogyakarta'],
    coordinates: { lat: -7.7557, lng: 110.3807 },
    monthlyPrice: 1350000,
    tag: 'Campur',
  },
  {
    id: 3,
    listingId: 103,
    name: 'Kos Kukusan Dekat UI',
    city: 'Depok',
    area: 'Kukusan',
    address: 'Kukusan, Beji, Kota Depok, Jawa Barat',
    nearbyCampuses: ['Universitas Indonesia', 'Politeknik Negeri Jakarta'],
    coordinates: { lat: -6.3627, lng: 106.8249 },
    monthlyPrice: 1200000,
    tag: 'Campur',
  },
  {
    id: 4,
    listingId: 104,
    name: 'Kos Putri Margonda',
    city: 'Depok',
    area: 'Margonda',
    address: 'Jl. Margonda Raya, Beji, Kota Depok, Jawa Barat',
    nearbyCampuses: ['Universitas Indonesia', 'Universitas Gunadarma'],
    coordinates: { lat: -6.3728, lng: 106.8321 },
    monthlyPrice: 1500000,
    tag: 'Putri',
  },
  {
    id: 5,
    listingId: 105,
    name: 'Kos Putra Dago Asri',
    city: 'Bandung',
    area: 'Dago',
    address: 'Dago, Coblong, Kota Bandung, Jawa Barat',
    nearbyCampuses: ['Institut Teknologi Bandung'],
    coordinates: { lat: -6.8796, lng: 107.6158 },
    monthlyPrice: 1650000,
    tag: 'Putra',
  },
  {
    id: 6,
    listingId: 106,
    name: 'Kos Jatinangor Student House',
    city: 'Bandung',
    area: 'Jatinangor',
    address: 'Jl. Raya Jatinangor, Sumedang, Jawa Barat',
    nearbyCampuses: ['Universitas Padjadjaran'],
    coordinates: { lat: -6.9281, lng: 107.7696 },
    monthlyPrice: 1100000,
    tag: 'Campur',
  },
  {
    id: 7,
    listingId: 107,
    name: 'Kos Dramaga Dekat IPB',
    city: 'Bogor',
    area: 'Dramaga',
    address: 'Babakan, Dramaga, Kabupaten Bogor, Jawa Barat',
    nearbyCampuses: ['IPB University'],
    coordinates: { lat: -6.5591, lng: 106.7255 },
    monthlyPrice: 850000,
    tag: 'Putra',
  },
  {
    id: 8,
    listingId: 108,
    name: 'Kos Jimbaran Kampus Udayana',
    city: 'Bali',
    area: 'Jimbaran',
    address: 'Jimbaran, Kuta Selatan, Kabupaten Badung, Bali',
    nearbyCampuses: ['Universitas Udayana'],
    coordinates: { lat: -8.7908, lng: 115.1722 },
    monthlyPrice: 1450000,
    tag: 'Campur',
  },
  {
    id: 9,
    listingId: 109,
    name: 'Kos Kemanggisan BINUS',
    city: 'Jakarta',
    area: 'Kemanggisan',
    address: 'Kemanggisan, Palmerah, Jakarta Barat',
    nearbyCampuses: ['BINUS University Kemanggisan'],
    coordinates: { lat: -6.2017, lng: 106.7824 },
    monthlyPrice: 2100000,
    tag: 'Campur',
  },
  {
    id: 10,
    listingId: 110,
    name: 'Kos Rawamangun UNJ',
    city: 'Jakarta',
    area: 'Rawamangun',
    address: 'Rawamangun, Pulo Gadung, Jakarta Timur',
    nearbyCampuses: ['Universitas Negeri Jakarta'],
    coordinates: { lat: -6.1939, lng: 106.8841 },
    monthlyPrice: 1750000,
    tag: 'Putri',
  },
  {
    id: 11,
    listingId: 111,
    name: 'Kos Lowokwaru UB',
    city: 'Malang',
    area: 'Lowokwaru',
    address: 'Lowokwaru, Kota Malang, Jawa Timur',
    nearbyCampuses: ['Universitas Brawijaya', 'Universitas Negeri Malang'],
    coordinates: { lat: -7.9525, lng: 112.6138 },
    monthlyPrice: 1000000,
    tag: 'Campur',
  },
  {
    id: 12,
    listingId: 112,
    name: 'Kos Keputih ITS',
    city: 'Surabaya',
    area: 'Keputih',
    address: 'Keputih, Sukolilo, Kota Surabaya, Jawa Timur',
    nearbyCampuses: ['Institut Teknologi Sepuluh Nopember'],
    coordinates: { lat: -7.2891, lng: 112.7978 },
    monthlyPrice: 1250000,
    tag: 'Putra',
  },
]

function normalizeId(value: string) {
  return value
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, 'id'),
  )
}

function mergeSearchCities(records: KosSearchRecord[]) {
  const cityMap = new Map<string, SearchCity>()

  searchCities.forEach((city) => {
    cityMap.set(city.city, {
      city: city.city,
      campuses: [...city.campuses],
      areas: [...city.areas],
    })
  })

  records.forEach((record) => {
    const existing = cityMap.get(record.city) ?? {
      city: record.city,
      campuses: [],
      areas: [],
    }

    cityMap.set(record.city, {
      city: record.city,
      campuses: uniqueSorted([...existing.campuses, ...record.nearbyCampuses]),
      areas: uniqueSorted([...existing.areas, record.area]),
    })
  })

  return Array.from(cityMap.values()).sort((left, right) =>
    left.city.localeCompare(right.city, 'id'),
  )
}

function createSearchableLocations(cities: SearchCity[]): SearchableLocation[] {
  const locations = new Map<string, SearchableLocation>()

  function addLocation(location: SearchableLocation) {
    locations.set(location.id, location)
  }

  indonesiaAdministrativeLocations.forEach(addLocation)

  cities.forEach((city) => {
    addLocation({
      id: `city-${normalizeId(city.city)}`,
      label: city.city,
      description: 'Kota',
      searchValue: city.city,
      keywords: [],
    })

    city.areas.forEach((area) => {
      addLocation({
        id: `area-${normalizeId(city.city)}-${normalizeId(area)}`,
        label: area,
        description: `Area di ${city.city}`,
        searchValue: area,
        keywords: [city.city],
      })
    })

    city.campuses.forEach((campus) => {
      addLocation({
        id: `campus-${normalizeId(city.city)}-${normalizeId(campus)}`,
        label: campus,
        description: `Kampus di ${city.city}`,
        searchValue: campus,
        keywords: [city.city],
      })
    })
  })

  return Array.from(locations.values())
}

const mergedSearchCities = mergeSearchCities(dummyKosSearchRecords)

export const searchMetadata: SearchMetadata = {
  cities: mergedSearchCities,
  popularCampuses: popularCampusSearches,
  searchableLocations: createSearchableLocations(mergedSearchCities),
}
