const wordReplacements: Array<[RegExp, string]> = [
  [/\buniv\b/g, 'universitas'],
  [/\buniversity\b/g, 'universitas'],
  [/\buniversities\b/g, 'universitas'],
  [/\buniversiti\b/g, 'universitas'],
  [/\buniversite\b/g, 'universitas'],
  [/\bjogyakarta\b/g, 'yogyakarta'],
  [/\bjogjakarta\b/g, 'yogyakarta'],
  [/\bjogja\b/g, 'yogyakarta'],
  [/\byogya\b/g, 'yogyakarta'],
  [/\bdjogja\b/g, 'yogyakarta'],
  [/\bgajah\b/g, 'gadjah'],
  [/\bgadja\b/g, 'gadjah'],
]

const queryAliases: Record<string, string[]> = {
  'dki jakarta': ['jakarta'],
  'daerah khusus ibukota jakarta': ['jakarta'],
  'di yogyakarta': ['yogyakarta'],
  'daerah istimewa yogyakarta': ['yogyakarta'],
  'jawa barat': ['bandung', 'depok', 'bogor', 'jatinangor'],
  jabar: ['bandung', 'depok', 'bogor', 'jatinangor'],
  'jawa tengah': ['semarang', 'surakarta', 'solo', 'purwokerto'],
  jateng: ['semarang', 'surakarta', 'solo', 'purwokerto'],
  'jawa timur': ['surabaya', 'malang'],
  jatim: ['surabaya', 'malang'],
  ugm: ['universitas gadjah mada'],
  uny: ['universitas negeri yogyakarta'],
  umy: ['universitas muhammadiyah yogyakarta'],
  uii: ['universitas islam indonesia'],
  ui: ['universitas indonesia'],
  itb: ['institut teknologi bandung'],
  unpad: ['universitas padjadjaran'],
  unair: ['universitas airlangga'],
  ub: ['universitas brawijaya'],
  its: ['institut teknologi sepuluh nopember'],
  ipb: ['ipb university'],
  binus: ['binus university kemanggisan'],
}

export function normalizeSearchText(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  return wordReplacements.reduce(
    (currentValue, [pattern, replacement]) =>
      currentValue.replace(pattern, replacement),
    normalized,
  )
}

export function getNormalizedSearchCandidates(value: string) {
  const normalized = normalizeSearchText(value)
  if (!normalized) return []

  return Array.from(
    new Set([normalized, ...(queryAliases[normalized] ?? []).map(normalizeSearchText)]),
  )
}
