import asyncio
from collections.abc import Iterable

from ..database import db
from ..errors import not_found
from ..search import distance_in_kilometers, fuzzy_match_score, normalize_search_text


LISTING_SELECT = """
select
  listing.id,
  listing.title,
  listing.city,
  listing.monthly_price,
  listing.rating,
  listing.tag,
  listing.address,
  listing.description,
  listing.room_size,
  listing.available_rooms,
  listing.owner_name,
  listing.image_url,
  listing.image_alt,
  listing.is_featured,
  listing.latitude,
  listing.longitude,
  (
    select json_build_object(
      'dpPercentage', terms.dp_percentage,
      'serviceFee', terms.service_fee,
      'adminFee', terms.admin_fee,
      'deposit', terms.deposit,
      'discountPercentage', terms.discount_percentage
    )
    from kos_payment_terms terms
    where terms.kos_id = listing.id
  ) as payment_terms,
  (
    select coalesce(json_agg(facility.name order by facility.sort_order), '[]'::json)
    from kos_facilities facility
    where facility.kos_id = listing.id
  ) as facilities,
  (
    select coalesce(
      json_agg(
        json_build_object(
          'id', category.id,
          'title', category.title,
          'items', (
            select coalesce(json_agg(item.name order by item.sort_order), '[]'::json)
            from kos_facility_category_items item
            where item.kos_id = listing.id and item.category_id = category.id
          )
        ) order by category.sort_order
      ),
      '[]'::json
    )
    from kos_facility_categories category
    where category.kos_id = listing.id
  ) as facility_categories,
  (
    select coalesce(json_agg(rule.rule order by rule.sort_order), '[]'::json)
    from kos_rules rule
    where rule.kos_id = listing.id
  ) as rules,
  (
    select coalesce(json_agg(duration.duration order by duration.sort_order), '[]'::json)
    from kos_rental_durations duration
    where duration.kos_id = listing.id
  ) as rental_durations,
  (
    select coalesce(
      json_agg(
        json_build_object(
          'id', media.id,
          'category', media.category,
          'label', media.label,
          'type', media.type,
          'url', media.url,
          'thumbnailUrl', media.thumbnail_url,
          'alt', media.alt
        ) order by media.sort_order
      ),
      '[]'::json
    )
    from kos_media media
    where media.kos_id = listing.id
  ) as media,
  (
    select coalesce(json_agg(campus.campus_name order by campus.sort_order), '[]'::json)
    from kos_nearby_campuses campus
    where campus.kos_id = listing.id
  ) as nearby_campuses
from kos_listings listing
"""


def _listing_from_row(row: dict) -> dict:
    return {
        "id": int(row["id"]),
        "title": row["title"],
        "location": row["city"],
        "monthlyPrice": int(row["monthly_price"]),
        "rating": float(row["rating"]),
        "tag": row["tag"],
        "address": row["address"],
        "description": row["description"],
        "facilities": row["facilities"] or [],
        "facilityCategories": row["facility_categories"] or [],
        "rules": row["rules"] or [],
        "roomSize": row["room_size"],
        "availableRooms": int(row["available_rooms"]),
        "rentalDurations": row["rental_durations"] or [],
        "owner": row["owner_name"],
        "paymentTerms": row["payment_terms"] or {
            "dpPercentage": 30,
            "serviceFee": 0,
            "adminFee": 0,
            "deposit": 0,
            "discountPercentage": 0,
        },
        "imageUrl": row["image_url"],
        "imageAlt": row["image_alt"],
        "media": row["media"] or [],
    }


def _infer_area(address: str, city: str) -> str:
    first_segment = address.split(",", 1)[0].strip()
    if not first_segment or first_segment.lower().startswith("jl."):
        return city
    return first_segment


def _search_record(row: dict) -> dict:
    listing_id = int(row["id"])
    return {
        "id": listing_id,
        "listingId": listing_id,
        "name": row["title"],
        "city": row["city"],
        "area": _infer_area(row["address"], row["city"]),
        "address": row["address"],
        "nearbyCampuses": row["nearby_campuses"] or [],
        "coordinates": {
            "lat": float(row["latitude"]),
            "lng": float(row["longitude"]),
        },
        "monthlyPrice": int(row["monthly_price"]),
        "tag": row["tag"],
    }


def _normalized_set(values: Iterable[str]) -> set[str]:
    return {normalize_search_text(value) for value in values}


def _matches_filters(listing: dict, filters: dict) -> bool:
    all_facilities = [
        *listing["facilities"],
        *(item for category in listing["facilityCategories"] for item in category["items"]),
    ]
    normalized_facilities = _normalized_set(all_facilities)
    searchable_rules = _normalized_set([*listing["rules"], *all_facilities])

    if filters["tags"] and listing["tag"] not in filters["tags"]:
        return False
    if filters["duration"] and filters["duration"] not in listing["rentalDurations"]:
        return False
    if filters["min_price"] is not None and listing["monthlyPrice"] < filters["min_price"]:
        return False
    if filters["max_price"] is not None and listing["monthlyPrice"] > filters["max_price"]:
        return False
    if any(normalize_search_text(value) not in normalized_facilities for value in filters["facilities"]):
        return False
    if any(
        not any(normalize_search_text(rule) in listing_rule for listing_rule in searchable_rules)
        for rule in filters["rules"]
    ):
        return False
    return not filters["available_only"] or listing["availableRooms"] > 0


def parse_csv(value: str | None) -> list[str]:
    return [item.strip() for item in (value or "").split(",") if item.strip()]


def parse_filters(
    tags: str | None,
    duration: str | None,
    min_price: int | None,
    max_price: int | None,
    facilities: str | None,
    rules: str | None,
    available_only: bool,
    sort: str,
) -> dict:
    return {
        "tags": parse_csv(tags),
        "duration": duration or None,
        "min_price": min_price,
        "max_price": max_price,
        "facilities": parse_csv(facilities),
        "rules": parse_csv(rules),
        "available_only": available_only,
        "sort": sort if sort in {"recommended", "price-asc", "price-desc"} else "recommended",
    }


async def list_listings(featured: bool | None = None) -> list[dict]:
    query = LISTING_SELECT
    args: list[object] = []
    if featured is not None:
        query += " where listing.is_featured = $1"
        args.append(featured)
    query += " order by listing.id"
    rows = await db.fetch(query, *args)
    return [_listing_from_row(row) for row in rows]


async def get_listing(listing_id: int) -> dict:
    row = await db.fetchrow(f"{LISTING_SELECT} where listing.id = $1 limit 1", listing_id)
    if row is None:
        raise not_found("Kos tidak ditemukan.")
    return _listing_from_row(row)


async def search_listings(
    raw_query: str,
    filters: dict,
    coordinates: tuple[float, float] | None,
) -> list[dict]:
    rows = await db.fetch(
        f"{LISTING_SELECT} where listing.latitude is not null and listing.longitude is not null order by listing.id"
    )
    matches: list[dict] = []

    for row in rows:
        listing = _listing_from_row(row)
        if not _matches_filters(listing, filters):
            continue

        primary_search_score = fuzzy_match_score(
            raw_query,
            [
                row["title"],
                row["city"],
                _infer_area(row["address"], row["city"]),
                *(row["nearby_campuses"] or []),
            ],
        )
        secondary_search_score = fuzzy_match_score(
            raw_query,
            [
                row["address"],
                row["description"],
                *listing["facilities"],
                *(item for category in listing["facilityCategories"] for item in category["items"]),
            ],
        )
        search_score = (
            primary_search_score
            if primary_search_score is not None
            else secondary_search_score + 5 if secondary_search_score is not None else None
        )
        if coordinates is None and search_score is None:
            continue

        record = _search_record(row)
        distance = None
        if coordinates is not None:
            distance = distance_in_kilometers(
                coordinates,
                (record["coordinates"]["lat"], record["coordinates"]["lng"]),
            )
            if distance > 25:
                continue

        matches.append(
            {
                "record": record,
                "listing": listing,
                "_search_score": search_score or 0,
                "_distance": distance,
            }
        )

    if coordinates is None and raw_query.strip() and matches:
        best_score = min(match["_search_score"] for match in matches)
        matches = [match for match in matches if match["_search_score"] <= best_score + 1]

    if coordinates is not None:
        matches.sort(key=lambda match: match["_distance"] or 0)
    elif filters["sort"] == "price-asc":
        matches.sort(key=lambda match: match["record"]["monthlyPrice"])
    elif filters["sort"] == "price-desc":
        matches.sort(key=lambda match: -match["record"]["monthlyPrice"])
    else:
        matches.sort(
            key=lambda match: (
                match["_search_score"],
                -int(match["listing"]["availableRooms"] > 0),
                -match["listing"]["rating"],
                match["record"]["id"],
            )
        )

    return [{"record": match["record"], "listing": match["listing"]} for match in matches]


async def get_search_metadata() -> dict:
    city_rows, location_rows, popular_rows = await asyncio.gather(
        db.fetch(
            """
            select
              city.name as city,
              coalesce(array_agg(distinct area.name order by area.name)
                filter (where area.id is not null), '{}') as areas,
              coalesce(array_agg(distinct campus.name order by campus.name)
                filter (where campus.id is not null), '{}') as campuses
            from admin_locations city
            left join admin_locations area
              on area.parent_id = city.id and area.type = 'area'
            left join admin_locations campus
              on campus.parent_id = city.id and campus.type = 'campus'
            where city.type = 'city'
            group by city.id, city.name
            order by city.name
            """
        ),
        db.fetch(
            """
            select location.id, location.name, location.type, location.aliases,
                   parent.name as parent_name
            from admin_locations location
            left join admin_locations parent on parent.id = location.parent_id
            order by
              case location.type
                when 'province' then 1
                when 'city' then 2
                when 'area' then 3
                when 'campus' then 4
              end,
              location.name
            """
        ),
        db.fetch(
            """
            select campus.name, count(assignment.kos_id) as listing_count
            from admin_locations campus
            join kos_campus_assignments assignment on assignment.campus_id = campus.id
            where campus.type = 'campus'
            group by campus.id, campus.name
            order by listing_count desc, campus.name
            limit 8
            """
        ),
    )

    descriptions = {
        "province": "Provinsi",
        "city": "Kota",
        "area": "Area",
        "campus": "Kampus",
    }
    searchable_locations = []
    for row in location_rows:
        parent_name = row["parent_name"]
        description = descriptions[row["type"]]
        if parent_name and row["type"] in {"area", "campus"}:
            description = f"{description} di {parent_name}"
        searchable_locations.append(
            {
                "id": f"{row['type']}-{row['id']}",
                "label": row["name"],
                "description": description,
                "searchValue": row["name"],
                "keywords": [*([parent_name] if parent_name else []), *(row["aliases"] or [])],
            }
        )

    return {
        "cities": [
            {"city": row["city"], "campuses": list(row["campuses"]), "areas": list(row["areas"])}
            for row in city_rows
        ],
        "popularCampuses": [row["name"] for row in popular_rows],
        "searchableLocations": searchable_locations,
    }
