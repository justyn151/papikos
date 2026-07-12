import { query } from '../db.js'
import { notFound } from '../errors.js'
import { getDistanceInKilometers } from '../utils/distance.js'
import {
  getNormalizedSearchCandidates,
  normalizeSearchText,
} from '../utils/normalizeSearchText.js'

const listingSelect = `
  select
    id,
    title,
    city,
    monthly_price,
    rating,
    tag,
    address,
    description,
    room_size,
    available_rooms,
    owner_name,
    image_url,
    image_alt,
    is_featured,
    latitude,
    longitude
  from kos_listings
`

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseCsv(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function inferArea(address, city) {
  const firstSegment = address.split(',')[0]?.trim()
  if (!firstSegment) return city
  if (firstSegment.toLocaleLowerCase('id-ID').startsWith('jl.')) return city
  return firstSegment
}

function compactListingRow(row) {
  return {
    id: Number(row.id),
    title: row.title,
    location: row.city,
    monthlyPrice: Number(row.monthly_price),
    rating: Number(row.rating),
    tag: row.tag,
    address: row.address,
    description: row.description,
    roomSize: row.room_size,
    availableRooms: Number(row.available_rooms),
    owner: row.owner_name,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
  }
}

async function getListingExtras(ids) {
  if (ids.length === 0) {
    return {
      paymentTerms: new Map(),
      facilities: new Map(),
      facilityCategories: new Map(),
      rules: new Map(),
      rentalDurations: new Map(),
      media: new Map(),
      nearbyCampuses: new Map(),
    }
  }

  const [
    paymentRows,
    facilityRows,
    categoryRows,
    categoryItemRows,
    ruleRows,
    durationRows,
    mediaRows,
    campusRows,
  ] = await Promise.all([
    query('select * from kos_payment_terms where kos_id = any($1::bigint[])', [ids]),
    query(
      'select kos_id, name from kos_facilities where kos_id = any($1::bigint[]) order by sort_order, name',
      [ids],
    ),
    query(
      'select kos_id, id, title from kos_facility_categories where kos_id = any($1::bigint[]) order by sort_order, title',
      [ids],
    ),
    query(
      'select kos_id, category_id, name from kos_facility_category_items where kos_id = any($1::bigint[]) order by sort_order, name',
      [ids],
    ),
    query(
      'select kos_id, rule from kos_rules where kos_id = any($1::bigint[]) order by sort_order, rule',
      [ids],
    ),
    query(
      'select kos_id, duration from kos_rental_durations where kos_id = any($1::bigint[]) order by sort_order, duration',
      [ids],
    ),
    query(
      'select kos_id, id, category, label, type, url, thumbnail_url, alt from kos_media where kos_id = any($1::bigint[]) order by sort_order, id',
      [ids],
    ),
    query(
      'select kos_id, campus_name from kos_nearby_campuses where kos_id = any($1::bigint[]) order by sort_order, campus_name',
      [ids],
    ),
  ])

  const paymentTerms = new Map(
    paymentRows.rows.map((row) => [
      Number(row.kos_id),
      {
        dpPercentage: Number(row.dp_percentage),
        serviceFee: Number(row.service_fee),
        adminFee: Number(row.admin_fee),
        deposit: Number(row.deposit),
        discountPercentage: Number(row.discount_percentage),
      },
    ]),
  )

  const facilities = new Map()
  const rules = new Map()
  const rentalDurations = new Map()
  const media = new Map()
  const nearbyCampuses = new Map()

  for (const row of facilityRows.rows) {
    const id = Number(row.kos_id)
    facilities.set(id, [...(facilities.get(id) ?? []), row.name])
  }

  for (const row of ruleRows.rows) {
    const id = Number(row.kos_id)
    rules.set(id, [...(rules.get(id) ?? []), row.rule])
  }

  for (const row of durationRows.rows) {
    const id = Number(row.kos_id)
    rentalDurations.set(id, [...(rentalDurations.get(id) ?? []), row.duration])
  }

  for (const row of mediaRows.rows) {
    const id = Number(row.kos_id)
    media.set(id, [
      ...(media.get(id) ?? []),
      {
        id: row.id,
        category: row.category,
        label: row.label,
        type: row.type,
        url: row.url,
        thumbnailUrl: row.thumbnail_url ?? undefined,
        alt: row.alt,
      },
    ])
  }

  for (const row of campusRows.rows) {
    const id = Number(row.kos_id)
    nearbyCampuses.set(id, [...(nearbyCampuses.get(id) ?? []), row.campus_name])
  }

  const categoryItems = new Map()
  for (const row of categoryItemRows.rows) {
    const key = `${row.kos_id}:${row.category_id}`
    categoryItems.set(key, [...(categoryItems.get(key) ?? []), row.name])
  }

  const facilityCategories = new Map()
  for (const row of categoryRows.rows) {
    const listingId = Number(row.kos_id)
    facilityCategories.set(listingId, [
      ...(facilityCategories.get(listingId) ?? []),
      {
        id: row.id,
        title: row.title,
        items: categoryItems.get(`${row.kos_id}:${row.id}`) ?? [],
      },
    ])
  }

  return {
    paymentTerms,
    facilities,
    facilityCategories,
    rules,
    rentalDurations,
    media,
    nearbyCampuses,
  }
}

function hydrateListing(row, extras) {
  const id = Number(row.id)

  return {
    ...compactListingRow(row),
    facilities: extras.facilities.get(id) ?? [],
    facilityCategories: extras.facilityCategories.get(id) ?? [],
    rules: extras.rules.get(id) ?? [],
    rentalDurations: extras.rentalDurations.get(id) ?? [],
    paymentTerms:
      extras.paymentTerms.get(id) ?? {
        dpPercentage: 30,
        serviceFee: 0,
        adminFee: 0,
        deposit: 0,
        discountPercentage: 0,
      },
    media: extras.media.get(id) ?? [],
  }
}

function createSearchRecord(row, extras) {
  const id = Number(row.id)
  return {
    id,
    listingId: id,
    name: row.title,
    city: row.city,
    area: inferArea(row.address, row.city),
    address: row.address,
    nearbyCampuses: extras.nearbyCampuses.get(id) ?? [],
    coordinates: {
      lat: Number(row.latitude),
      lng: Number(row.longitude),
    },
    monthlyPrice: Number(row.monthly_price),
    tag: row.tag,
  }
}

function matchesFilters(listing, filters) {
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

function searchableText(row, listing, extras) {
  const id = Number(row.id)
  return [
    row.title,
    row.city,
    inferArea(row.address, row.city),
    row.address,
    row.description,
    ...(extras.nearbyCampuses.get(id) ?? []),
    ...listing.facilities,
    ...listing.facilityCategories.flatMap((category) => category.items),
  ].join(' ')
}

export function parseSearchFilters(searchParams) {
  return {
    tags: parseCsv(searchParams.tags),
    duration: searchParams.duration || null,
    minPrice: numberOrNull(searchParams.minPrice),
    maxPrice: numberOrNull(searchParams.maxPrice),
    facilities: parseCsv(searchParams.facilities),
    rules: parseCsv(searchParams.rules),
    availableOnly: searchParams.availableOnly === 'true',
  }
}

export async function getFeaturedListings() {
  const result = await query(
    `${listingSelect} where is_featured = true order by id asc`,
  )
  const ids = result.rows.map((row) => Number(row.id))
  const extras = await getListingExtras(ids)
  return result.rows.map((row) => hydrateListing(row, extras))
}

export async function getListingById(id) {
  const result = await query(`${listingSelect} where id = $1 limit 1`, [id])
  if (result.rowCount === 0) throw notFound('Kos tidak ditemukan.')

  const extras = await getListingExtras([id])
  return hydrateListing(result.rows[0], extras)
}

export async function searchListings({ query: rawQuery, filters, coordinates }) {
  const result = await query(
    `${listingSelect} where latitude is not null and longitude is not null order by id asc`,
  )
  const ids = result.rows.map((row) => Number(row.id))
  const extras = await getListingExtras(ids)
  const queryCandidates = getNormalizedSearchCandidates(rawQuery)

  const results = result.rows.flatMap((row) => {
    const listing = hydrateListing(row, extras)

    if (!matchesFilters(listing, filters)) return []

    if (!coordinates && queryCandidates.length > 0) {
      const haystack = normalizeSearchText(searchableText(row, listing, extras))
      const matched = queryCandidates.some((candidate) => haystack.includes(candidate))
      if (!matched) return []
    }

    const record = createSearchRecord(row, extras)

    if (coordinates) {
      const distance = getDistanceInKilometers(coordinates, record.coordinates)
      if (distance > 25) return []
      return [{ record, listing, distance }]
    }

    return [{ record, listing }]
  })

  return results
    .sort((left, right) => (left.distance ?? 0) - (right.distance ?? 0))
    .map(({ record, listing }) => ({ record, listing }))
}

export async function getSearchMetadata() {
  const [cityRows, adminRows, campusRows] = await Promise.all([
    query(
      `
        select
          city,
          array_agg(distinct split_part(address, ',', 1)) as areas
        from kos_listings
        group by city
        order by city
      `,
    ),
    query(
      `
        select id, name, type, aliases
        from admin_locations
        order by
          case type
            when 'province' then 1
            when 'city' then 2
            when 'campus' then 3
            else 4
          end,
          name
      `,
    ),
    query(
      `
        select k.city, array_agg(distinct c.campus_name order by c.campus_name) as campuses
        from kos_listings k
        join kos_nearby_campuses c on c.kos_id = k.id
        group by k.city
      `,
    ),
  ])

  const campusByCity = new Map(
    campusRows.rows.map((row) => [row.city, row.campuses ?? []]),
  )

  const cities = cityRows.rows.map((row) => ({
    city: row.city,
    campuses: campusByCity.get(row.city) ?? [],
    areas: (row.areas ?? []).filter(Boolean),
  }))

  const searchableLocations = adminRows.rows.map((row) => ({
    id: `${row.type}-${row.id}`,
    label: row.name,
    description:
      row.type === 'province'
        ? 'Provinsi'
        : row.type === 'city'
          ? 'Kota'
          : row.type === 'campus'
            ? 'Kampus'
            : 'Area',
    searchValue: row.name,
    keywords: row.aliases ?? [],
  }))

  return {
    cities,
    popularCampuses: [
      'Universitas Gadjah Mada',
      'Universitas Indonesia',
      'Institut Teknologi Bandung',
      'Universitas Padjadjaran',
      'Universitas Airlangga',
      'Universitas Brawijaya',
      'Universitas Negeri Yogyakarta',
      'IPB University',
    ],
    searchableLocations,
  }
}

