import type { SearchableLocation } from '../types/search'

function normalizeId(value: string) {
  return value
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const provinceNames = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatera Selatan',
  'Kepulauan Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'Banten',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Gorontalo',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Barat Daya',
]

const provinceAliases: Record<string, string[]> = {
  'DKI Jakarta': ['jakarta', 'daerah khusus ibukota jakarta'],
  'DI Yogyakarta': ['yogyakarta', 'jogja', 'jogjakarta', 'yogya'],
  'Jawa Barat': ['jabar'],
  'Jawa Tengah': ['jateng'],
  'Jawa Timur': ['jatim'],
  'Sumatera Utara': ['sumut'],
  'Sumatera Barat': ['sumbar'],
  'Sumatera Selatan': ['sumsel'],
  'Kalimantan Barat': ['kalbar'],
  'Kalimantan Tengah': ['kalteng'],
  'Kalimantan Selatan': ['kalsel'],
  'Kalimantan Timur': ['kaltim'],
  'Kalimantan Utara': ['kaltara'],
  'Sulawesi Utara': ['sulut'],
  'Sulawesi Tengah': ['sulteng'],
  'Sulawesi Barat': ['sulbar'],
  'Sulawesi Selatan': ['sulsel'],
  'Sulawesi Tenggara': ['sultra'],
  'Nusa Tenggara Barat': ['ntb'],
  'Nusa Tenggara Timur': ['ntt'],
}

export const indonesiaAdministrativeLocations: SearchableLocation[] =
  provinceNames.map((province) => ({
    id: `province-${normalizeId(province)}`,
    label: province,
    description: 'Provinsi',
    searchValue: province,
    keywords: provinceAliases[province] ?? [],
  }))
