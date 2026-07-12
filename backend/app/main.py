from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
import json

from app.config import settings
from app.database import db
from app.models import (
    KosListing,
    KosSearchResult,
    KosSearchRecord,
    Coordinates,
    PaymentTerms,
    FacilityCategory,
    KosMedia,
    SearchMetadata,
    SearchCity,
    SearchableLocation
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Establish connection pool on startup
    await db.connect()
    yield
    # Clean up connection pool on shutdown
    await db.disconnect()

app = FastAPI(
    title="Papikos Backend API",
    lifespan=lifespan
)

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_json(val):
    if val is None:
        return None
    if isinstance(val, str):
        return json.loads(val)
    return val

def row_to_kos_listing(row) -> KosListing:
    payment_terms = parse_json(row['payment_terms'])
    facilities = parse_json(row['facilities']) or []
    facility_categories = parse_json(row['facility_categories']) or []
    rules = parse_json(row['rules']) or []
    rental_durations = parse_json(row['rental_durations']) or []
    media = parse_json(row['media']) or []

    # Map payment_terms details safely
    terms = PaymentTerms(
        dpPercentage=payment_terms.get('dpPercentage', 0) if payment_terms else 0,
        serviceFee=payment_terms.get('serviceFee', 0) if payment_terms else 0,
        adminFee=payment_terms.get('adminFee', 0) if payment_terms else 0,
        deposit=payment_terms.get('deposit', 0) if payment_terms else 0,
        discountPercentage=payment_terms.get('discountPercentage', 0) if payment_terms else 0,
    )

    # Map facility categories details
    categories = []
    for cat in facility_categories:
        categories.append(FacilityCategory(
            id=cat['id'],
            title=cat['title'],
            items=cat['items'] or []
        ))

    # Map media objects
    media_list = []
    for m in media:
        media_list.append(KosMedia(
            id=m['id'],
            category=m['category'],
            label=m['label'],
            type=m['type'],
            url=m['url'],
            thumbnailUrl=m.get('thumbnailUrl'),
            alt=m['alt']
        ))

    return KosListing(
        id=row['id'],
        title=row['title'],
        location=row['location'],
        monthlyPrice=row['monthlyprice'],
        rating=float(row['rating']),
        tag=row['tag'],
        address=row['address'],
        description=row['description'],
        facilities=facilities,
        facilityCategories=categories,
        rules=rules,
        roomSize=row['roomsize'],
        availableRooms=row['availablerooms'],
        rentalDurations=rental_durations,
        owner=row['owner'],
        paymentTerms=terms,
        imageUrl=row['imageurl'],
        imageAlt=row['imagealt'],
        media=media_list
    )

def row_to_kos_search_record(row) -> KosSearchRecord:
    nearby_campuses = parse_json(row['nearby_campuses']) or []
    
    # Heuristic area deduction fallback
    area = row['area']
    if not area:
        # Fall back to the first address component (e.g. Pogung, Margonda, etc.)
        parts = row['address'].split(',')
        area = parts[0].replace('Jl.', '').strip() if parts else ""

    # Map lat/lng floats safely
    lat = float(row['latitude']) if row['latitude'] is not None else 0.0
    lng = float(row['longitude']) if row['longitude'] is not None else 0.0
    
    return KosSearchRecord(
        id=row['id'],
        listingId=row['id'],
        name=row['title'],
        city=row['location'],
        area=area,
        address=row['address'],
        nearbyCampuses=nearby_campuses,
        coordinates=Coordinates(lat=lat, lng=lng),
        monthlyPrice=row['monthlyprice'],
        tag=row['tag']
    )

@app.get(
    "/api/kos",
    response_model=List[KosListing],
    tags=["Listings"],
    summary="Get all Listings",
    description="Retrieve a list of all Kos listings, optionally filtered by featured status for the homepage carousel."
)
async def get_kos(
    featured: Optional[bool] = Query(
        None,
        description="Filter for featured listings (true) or non-featured (false). If omitted, returns all listings."
    )
):
    query = """
        SELECT
          kl.id, kl.title, kl.city as location, kl.monthly_price as monthlyprice,
          kl.rating, kl.tag, kl.address, kl.description, kl.room_size as roomsize,
          kl.available_rooms as availablerooms, kl.owner_name as owner,
          kl.image_url as imageurl, kl.image_alt as imagealt,
          (
            SELECT json_build_object(
              'dpPercentage', kpt.dp_percentage,
              'serviceFee', kpt.service_fee,
              'adminFee', kpt.admin_fee,
              'deposit', kpt.deposit,
              'discountPercentage', kpt.discount_percentage
            )
            FROM kos_payment_terms kpt
            WHERE kpt.kos_id = kl.id
          ) as payment_terms,
          (
            SELECT coalesce(json_agg(kf.name ORDER BY kf.sort_order), '[]'::json)
            FROM kos_facilities kf
            WHERE kf.kos_id = kl.id
          ) as facilities,
          (
            SELECT coalesce(json_agg(json_build_object(
              'id', kfc.id,
              'title', kfc.title,
              'items', (
                SELECT coalesce(json_agg(kfci.name ORDER BY kfci.sort_order), '[]'::json)
                FROM kos_facility_category_items kfci
                WHERE kfci.kos_id = kl.id AND kfci.category_id = kfc.id
              )
            ) ORDER BY kfc.sort_order), '[]'::json)
            FROM kos_facility_categories kfc
            WHERE kfc.kos_id = kl.id
          ) as facility_categories,
          (
            SELECT coalesce(json_agg(kr.rule ORDER BY kr.sort_order), '[]'::json)
            FROM kos_rules kr
            WHERE kr.kos_id = kl.id
          ) as rules,
          (
            SELECT coalesce(json_agg(krd.duration ORDER BY krd.sort_order), '[]'::json)
            FROM kos_rental_durations krd
            WHERE krd.kos_id = kl.id
          ) as rental_durations,
          (
            SELECT coalesce(json_agg(json_build_object(
              'id', km.id,
              'category', km.category,
              'label', km.label,
              'type', km.type,
              'url', km.url,
              'thumbnailUrl', km.thumbnail_url,
              'alt', km.alt
            ) ORDER BY km.sort_order), '[]'::json)
            FROM kos_media km
            WHERE km.kos_id = kl.id
          ) as media,
          (
            SELECT coalesce(json_agg(knc.campus_name ORDER BY knc.sort_order), '[]'::json)
            FROM kos_nearby_campuses knc
            WHERE knc.kos_id = kl.id
          ) as nearby_campuses,
          (
            SELECT al.name FROM admin_locations al 
            WHERE al.type = 'area' AND (kl.address ILIKE '%' || al.name || '%' OR kl.title ILIKE '%' || al.name || '%')
            LIMIT 1
          ) as area
        FROM kos_listings kl
    """
    
    if featured is not None:
        query += " WHERE kl.is_featured = $1"
        args = [featured]
    else:
        args = []
        
    async with db.connection() as conn:
        rows = await conn.fetch(query, *args)
        
    return [row_to_kos_listing(row) for row in rows]

@app.get(
    "/api/kos/search",
    response_model=List[KosSearchResult],
    tags=["Search"],
    summary="Search Listings",
    description="Perform complex searches and filters on listings. Supports querying by location, campuses, price ranges, gender tags, and facilities."
)
async def search_kos(
    query: Optional[str] = Query("", description="Search term (city, campus, area, or listing name)"),
    tags: Optional[str] = Query(None, description="Comma-separated gender tags: Putra, Putri, Campur"),
    duration: Optional[str] = Query(None, description="Rental duration limit (e.g. Bulanan)"),
    minPrice: Optional[int] = Query(None, description="Minimum monthly price in Rupiah"),
    maxPrice: Optional[int] = Query(None, description="Maximum monthly price in Rupiah"),
    facilities: Optional[str] = Query(None, description="Comma-separated list of required facilities"),
    rules: Optional[str] = Query(None, description="Comma-separated list of rules"),
    availableOnly: Optional[bool] = Query(False, description="Filter to only show listings with available rooms")
):
    base_query = """
        SELECT
          kl.id, kl.title, kl.city as location, kl.monthly_price as monthlyprice,
          kl.rating, kl.tag, kl.address, kl.description, kl.room_size as roomsize,
          kl.available_rooms as availablerooms, kl.owner_name as owner,
          kl.image_url as imageurl, kl.image_alt as imagealt,
          kl.latitude, kl.longitude,
          (
            SELECT json_build_object(
              'dpPercentage', kpt.dp_percentage,
              'serviceFee', kpt.service_fee,
              'adminFee', kpt.admin_fee,
              'deposit', kpt.deposit,
              'discountPercentage', kpt.discount_percentage
            )
            FROM kos_payment_terms kpt
            WHERE kpt.kos_id = kl.id
          ) as payment_terms,
          (
            SELECT coalesce(json_agg(kf.name ORDER BY kf.sort_order), '[]'::json)
            FROM kos_facilities kf
            WHERE kf.kos_id = kl.id
          ) as facilities,
          (
            SELECT coalesce(json_agg(json_build_object(
              'id', kfc.id,
              'title', kfc.title,
              'items', (
                SELECT coalesce(json_agg(kfci.name ORDER BY kfci.sort_order), '[]'::json)
                FROM kos_facility_category_items kfci
                WHERE kfci.kos_id = kl.id AND kfci.category_id = kfc.id
              )
            ) ORDER BY kfc.sort_order), '[]'::json)
            FROM kos_facility_categories kfc
            WHERE kfc.kos_id = kl.id
          ) as facility_categories,
          (
            SELECT coalesce(json_agg(kr.rule ORDER BY kr.sort_order), '[]'::json)
            FROM kos_rules kr
            WHERE kr.kos_id = kl.id
          ) as rules,
          (
            SELECT coalesce(json_agg(krd.duration ORDER BY krd.sort_order), '[]'::json)
            FROM kos_rental_durations krd
            WHERE krd.kos_id = kl.id
          ) as rental_durations,
          (
            SELECT coalesce(json_agg(json_build_object(
              'id', km.id,
              'category', km.category,
              'label', km.label,
              'type', km.type,
              'url', km.url,
              'thumbnailUrl', km.thumbnail_url,
              'alt', km.alt
            ) ORDER BY km.sort_order), '[]'::json)
            FROM kos_media km
            WHERE km.kos_id = kl.id
          ) as media,
          (
            SELECT coalesce(json_agg(knc.campus_name ORDER BY knc.sort_order), '[]'::json)
            FROM kos_nearby_campuses knc
            WHERE knc.kos_id = kl.id
          ) as nearby_campuses,
          (
            SELECT al.name FROM admin_locations al 
            WHERE al.type = 'area' AND (kl.address ILIKE '%' || al.name || '%' OR kl.title ILIKE '%' || al.name || '%')
            LIMIT 1
          ) as area
        FROM kos_listings kl
    """

    query_conditions = []
    params = []

    # Map query strings matching listing, city, campus or area aliases
    if query:
        q = query.strip()
        query_index = len(params) + 1
        params.append(f"%{q}%")
        query_conditions.append(f"""
            (
                kl.title ILIKE ${query_index}
                OR kl.city ILIKE ${query_index}
                OR kl.address ILIKE ${query_index}
                OR EXISTS (
                    SELECT 1 FROM kos_nearby_campuses knc
                    WHERE knc.kos_id = kl.id AND knc.campus_name ILIKE ${query_index}
                )
                OR EXISTS (
                    SELECT 1 FROM admin_locations al
                    WHERE al.type = 'area'
                      AND (kl.address ILIKE '%' || al.name || '%' OR kl.title ILIKE '%' || al.name || '%')
                      AND al.name ILIKE ${query_index}
                )
            )
        """)

    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            tag_index = len(params) + 1
            params.append(tag_list)
            query_conditions.append(f"kl.tag::text = ANY(${tag_index})")

    if duration:
        duration_index = len(params) + 1
        params.append(duration)
        query_conditions.append(f"""
            EXISTS (
                SELECT 1 FROM kos_rental_durations krd
                WHERE krd.kos_id = kl.id AND krd.duration::text = ${duration_index}
            )
        """)

    if minPrice is not None:
        min_price_index = len(params) + 1
        params.append(minPrice)
        query_conditions.append(f"kl.monthly_price >= ${min_price_index}")

    if maxPrice is not None:
        max_price_index = len(params) + 1
        params.append(maxPrice)
        query_conditions.append(f"kl.monthly_price <= ${max_price_index}")

    if facilities:
        facility_list = [f.strip() for f in facilities.split(",") if f.strip()]
        for facility in facility_list:
            fac_index = len(params) + 1
            params.append(facility)
            query_conditions.append(f"""
                (
                    EXISTS (
                        SELECT 1 FROM kos_facilities kf
                        WHERE kf.kos_id = kl.id AND kf.name ILIKE ${fac_index}
                    )
                    OR EXISTS (
                        SELECT 1 FROM kos_facility_category_items kfci
                        WHERE kfci.kos_id = kl.id AND kfci.name ILIKE ${fac_index}
                    )
                )
            """)

    if rules:
        rule_list = [r.strip() for r in rules.split(",") if r.strip()]
        for rule in rule_list:
            rule_index = len(params) + 1
            params.append(f"%{rule}%")
            query_conditions.append(f"""
                (
                    EXISTS (
                        SELECT 1 FROM kos_rules kr
                        WHERE kr.kos_id = kl.id AND kr.rule ILIKE ${rule_index}
                    )
                    OR EXISTS (
                        SELECT 1 FROM kos_facilities kf
                        WHERE kf.kos_id = kl.id AND kf.name ILIKE ${rule_index}
                    )
                    OR EXISTS (
                        SELECT 1 FROM kos_facility_category_items kfci
                        WHERE kfci.kos_id = kl.id AND kfci.name ILIKE ${rule_index}
                    )
                )
            """)

    if availableOnly:
        query_conditions.append("kl.available_rooms > 0")

    if query_conditions:
        base_query += " WHERE " + " AND ".join(query_conditions)

    async with db.connection() as conn:
        rows = await conn.fetch(base_query, *params)

    results = []
    for row in rows:
        listing = row_to_kos_listing(row)
        record = row_to_kos_search_record(row)
        results.append(KosSearchResult(record=record, listing=listing))

    return results

@app.get(
    "/api/kos/{id}",
    response_model=KosListing,
    tags=["Listings"],
    summary="Get Listing by ID",
    description="Retrieve detailed information for a single Kos listing by its unique identifier.",
    responses={
        404: {
            "description": "Kos listing not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Kos tidak ditemukan"}
                }
            }
        }
    }
)
async def get_kos_by_id(
    id: int = Path(..., description="Unique ID of the Kos listing")
):
    query = """
        SELECT
          kl.id, kl.title, kl.city as location, kl.monthly_price as monthlyprice,
          kl.rating, kl.tag, kl.address, kl.description, kl.room_size as roomsize,
          kl.available_rooms as availablerooms, kl.owner_name as owner,
          kl.image_url as imageurl, kl.image_alt as imagealt,
          (
            SELECT json_build_object(
              'dpPercentage', kpt.dp_percentage,
              'serviceFee', kpt.service_fee,
              'adminFee', kpt.admin_fee,
              'deposit', kpt.deposit,
              'discountPercentage', kpt.discount_percentage
            )
            FROM kos_payment_terms kpt
            WHERE kpt.kos_id = kl.id
          ) as payment_terms,
          (
            SELECT coalesce(json_agg(kf.name ORDER BY kf.sort_order), '[]'::json)
            FROM kos_facilities kf
            WHERE kf.kos_id = kl.id
          ) as facilities,
          (
            SELECT coalesce(json_agg(json_build_object(
              'id', kfc.id,
              'title', kfc.title,
              'items', (
                SELECT coalesce(json_agg(kfci.name ORDER BY kfci.sort_order), '[]'::json)
                FROM kos_facility_category_items kfci
                WHERE kfci.kos_id = kl.id AND kfci.category_id = kfc.id
              )
            ) ORDER BY kfc.sort_order), '[]'::json)
            FROM kos_facility_categories kfc
            WHERE kfc.kos_id = kl.id
          ) as facility_categories,
          (
            SELECT coalesce(json_agg(kr.rule ORDER BY kr.sort_order), '[]'::json)
            FROM kos_rules kr
            WHERE kr.kos_id = kl.id
          ) as rules,
          (
            SELECT coalesce(json_agg(krd.duration ORDER BY krd.sort_order), '[]'::json)
            FROM kos_rental_durations krd
            WHERE krd.kos_id = kl.id
          ) as rental_durations,
          (
            SELECT coalesce(json_agg(json_build_object(
              'id', km.id,
              'category', km.category,
              'label', km.label,
              'type', km.type,
              'url', km.url,
              'thumbnailUrl', km.thumbnail_url,
              'alt', km.alt
            ) ORDER BY km.sort_order), '[]'::json)
            FROM kos_media km
            WHERE km.kos_id = kl.id
          ) as media,
          (
            SELECT coalesce(json_agg(knc.campus_name ORDER BY knc.sort_order), '[]'::json)
            FROM kos_nearby_campuses knc
            WHERE knc.kos_id = kl.id
          ) as nearby_campuses,
          (
            SELECT al.name FROM admin_locations al 
            WHERE al.type = 'area' AND (kl.address ILIKE '%' || al.name || '%' OR kl.title ILIKE '%' || al.name || '%')
            LIMIT 1
          ) as area
        FROM kos_listings kl
        WHERE kl.id = $1
    """
    async with db.connection() as conn:
        row = await conn.fetchrow(query, id)
        
    if not row:
        raise HTTPException(status_code=404, detail="Kos tidak ditemukan")
        
    return row_to_kos_listing(row)

@app.get(
    "/api/search/metadata",
    response_model=SearchMetadata,
    tags=["Metadata"],
    summary="Get Search Metadata",
    description="Fetch list suggestions including cities, campuses, areas, and popular campus options to initialize frontend autocomplete search."
)
async def get_search_metadata():
    city_query = """
        SELECT
          c.name as city,
          (
            SELECT coalesce(json_agg(a.name ORDER BY a.name), '[]'::json)
            FROM admin_locations a
            WHERE a.type = 'area' AND a.parent_id = c.id
          ) as areas,
          (
            SELECT coalesce(json_agg(cam.name ORDER BY cam.name), '[]'::json)
            FROM admin_locations cam
            WHERE cam.type = 'campus' AND cam.parent_id = c.id
          ) as campuses
        FROM admin_locations c
        WHERE c.type = 'city'
        ORDER BY c.name
    """
    
    location_query = """
        SELECT
          al.id,
          al.name,
          al.type,
          al.aliases,
          p.name as parent_name
        FROM admin_locations al
        LEFT JOIN admin_locations p ON al.parent_id = p.id
        ORDER BY al.type, al.name
    """
    
    async with db.connection() as conn:
        city_rows = await conn.fetch(city_query)
        location_rows = await conn.fetch(location_query)

    cities = []
    for row in city_rows:
        cities.append(SearchCity(
            city=row['city'],
            campuses=parse_json(row['campuses']) or [],
            areas=parse_json(row['areas']) or []
        ))

    popular_campuses = [
        'Universitas Gadjah Mada',
        'Universitas Indonesia',
        'Institut Teknologi Bandung',
        'Universitas Padjadjaran',
        'Universitas Airlangga',
        'Universitas Brawijaya',
        'Universitas Negeri Yogyakarta',
        'IPB University',
    ]

    def normalize_id(val: str) -> str:
        import re
        val = val.lower()
        val = re.sub(r'[^a-z0-9]+', '-', val)
        return val.strip('-')

    searchable_locations = []
    for row in location_rows:
        name = row['name']
        loc_type = row['type']
        aliases = row['aliases'] or []
        parent_name = row['parent_name']

        if loc_type == 'province':
            loc_id = f"province-{normalize_id(name)}"
            label = name
            desc = "Provinsi"
            search_val = name
            keywords = aliases
        elif loc_type == 'city':
            loc_id = f"city-{normalize_id(name)}"
            label = name
            desc = "Kota"
            search_val = name
            keywords = aliases
        elif loc_type == 'area':
            p_name = parent_name or "Unknown"
            loc_id = f"area-{normalize_id(p_name)}-{normalize_id(name)}"
            label = name
            desc = f"Area di {p_name}"
            search_val = name
            keywords = [p_name] + aliases
        elif loc_type == 'campus':
            p_name = parent_name or "Unknown"
            loc_id = f"campus-{normalize_id(p_name)}-{normalize_id(name)}"
            label = name
            desc = f"Kampus di {p_name}"
            search_val = name
            keywords = [p_name] + aliases
        else:
            continue

        searchable_locations.append(SearchableLocation(
            id=loc_id,
            label=label,
            description=desc,
            searchValue=search_val,
            keywords=keywords
        ))

    return SearchMetadata(
        cities=cities,
        popularCampuses=popular_campuses,
        searchableLocations=searchable_locations
    )
