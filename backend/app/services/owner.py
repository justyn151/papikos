import asyncio
import re

from ..database import db
from ..errors import ApiError, not_found, validation_error
from ..schemas import OwnerListingCreatePayload, OwnerListingUpdatePayload
from .auth import require_role


REQUEST_TYPES = {
    "surveys": {
        "table": "survey_requests",
        "statuses": {"pending", "confirmed", "completed", "cancelled"},
    },
    "contacts": {
        "table": "contact_requests",
        "statuses": {"open", "answered", "closed"},
    },
    "rentals": {
        "table": "rental_applications",
        "statuses": {"submitted", "reviewing", "accepted", "rejected", "cancelled"},
    },
}

OWNER_TAGS = {"Putra", "Putri", "Campur"}
SUBMITTABLE_STATUSES = {"draft", "rejected"}
RENTAL_DURATIONS = {"Bulanan", "3 Bulan", "6 Bulan", "Tahunan"}
MEDIA_CATEGORIES = {
    "bedroom",
    "bathroom",
    "building",
    "common-area",
    "exterior",
    "other",
    "video-tour",
}


OWNER_LISTING_SELECT = """
select
  listing.id, listing.title, listing.city, listing.monthly_price, listing.rating,
  listing.tag, listing.address, listing.address_notes, listing.description,
  listing.room_type_name, listing.room_size, listing.total_rooms,
  listing.available_rooms, listing.owner_name, listing.image_url,
  listing.image_alt, listing.latitude, listing.longitude,
  listing.moderation_status, listing.review_notes, listing.submitted_at,
  listing.reviewed_at, listing.published_at, listing.last_inventory_update,
  listing.created_at, listing.updated_at,
  (
    select json_build_object(
      'dpPercentage', terms.dp_percentage,
      'serviceFee', terms.service_fee,
      'adminFee', terms.admin_fee,
      'deposit', terms.deposit,
      'discountPercentage', terms.discount_percentage
    )
    from kos_payment_terms terms where terms.kos_id = listing.id
  ) as payment_terms,
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
    from kos_media media where media.kos_id = listing.id
  ) as media,
  (
    select coalesce(json_agg(assignment.facility_id order by assignment.sort_order), '[]'::json)
    from kos_facility_assignments assignment where assignment.kos_id = listing.id
  ) as facility_ids,
  (
    select coalesce(json_agg(assignment.rule_id order by assignment.sort_order), '[]'::json)
    from kos_rule_assignments assignment where assignment.kos_id = listing.id
  ) as rule_ids,
  (
    select coalesce(json_agg(duration.duration order by duration.sort_order), '[]'::json)
    from kos_rental_durations duration where duration.kos_id = listing.id
  ) as rental_durations,
  (
    select coalesce(
      json_agg(
        json_build_object(
          'id', custom.id, 'category', custom.category, 'name', custom.name
        ) order by custom.sort_order, custom.id
      ),
      '[]'::json
    )
    from kos_custom_facilities custom where custom.kos_id = listing.id
  ) as custom_facilities,
  (
    select coalesce(
      json_agg(
        json_build_object('id', custom.id, 'name', custom.name)
        order by custom.sort_order, custom.id
      ),
      '[]'::json
    )
    from kos_custom_rules custom where custom.kos_id = listing.id
  ) as custom_rules
from kos_listings listing
"""


def require_verified_owner(user: dict) -> None:
    require_role(user, "pemilik-kos", "Fitur ini hanya tersedia untuk pemilik kos.")
    if user.get("verificationStatus") != "verified":
        raise ApiError(
            403,
            "Akun pemilik harus diverifikasi admin sebelum mengelola kos.",
            "OWNER_NOT_VERIFIED",
        )


def validate_submission_status(current_status: str) -> None:
    if current_status not in SUBMITTABLE_STATUSES:
        raise validation_error(
            "Kos belum dapat diajukan dari status saat ini.",
            {"status": "Hanya kos draft atau ditolak yang dapat diajukan ulang."},
        )


def _payload_value(item: object, field: str, default: object = "") -> object:
    if isinstance(item, dict):
        return item.get(field, default)
    return getattr(item, field, default)


def normalize_media(items: list[object]) -> list[dict]:
    if len(items) > 20:
        raise validation_error(
            "Maksimal 20 media untuk satu listing.",
            {"media": "Hapus beberapa foto sebelum menyimpan."},
        )

    normalized: list[dict] = []
    used_ids: set[str] = set()
    fields: dict[str, str] = {}
    for index, item in enumerate(items):
        media_id = re.sub(
            r"[^a-zA-Z0-9_-]+",
            "-",
            str(_payload_value(item, "id", "") or f"media-{index + 1}"),
        ).strip("-")[:80]
        media_id = media_id or f"media-{index + 1}"
        base_id = media_id
        suffix = 2
        while media_id in used_ids:
            media_id = f"{base_id}-{suffix}"
            suffix += 1
        used_ids.add(media_id)

        category = str(_payload_value(item, "category", "other")).strip().lower()
        media_type = str(_payload_value(item, "type", "image")).strip().lower()
        url = str(_payload_value(item, "url")).strip()
        label = str(_payload_value(item, "label")).strip()
        alt = str(_payload_value(item, "alt")).strip()
        thumbnail_url = str(_payload_value(item, "thumbnailUrl") or "").strip()

        if category not in MEDIA_CATEGORIES:
            fields[f"media.{index}.category"] = "Kategori foto tidak valid."
        if media_type not in {"image", "video"}:
            fields[f"media.{index}.type"] = "Tipe media harus image atau video."
        if not url:
            fields[f"media.{index}.url"] = "URL media wajib diisi."
        if not label:
            fields[f"media.{index}.label"] = "Label media wajib diisi."
        if not alt:
            fields[f"media.{index}.alt"] = "Deskripsi aksesibilitas wajib diisi."

        normalized.append(
            {
                "id": media_id,
                "category": category,
                "label": label[:120],
                "type": media_type,
                "url": url,
                "thumbnail_url": thumbnail_url or None,
                "alt": alt[:300],
            }
        )

    if fields:
        raise validation_error("Data galeri belum valid.", fields)
    if normalized and normalized[0]["type"] != "image":
        raise validation_error(
            "Cover listing harus berupa gambar.",
            {"media.0.type": "Pindahkan foto ke urutan pertama sebelum menyimpan."},
        )
    return normalized


def normalize_custom_content(
    facilities: list[object],
    rules: list[object],
) -> tuple[list[dict], list[dict]]:
    if len(facilities) > 30 or len(rules) > 20:
        raise validation_error(
            "Terlalu banyak fasilitas atau aturan tambahan.",
            {"customContent": "Maksimal 30 fasilitas dan 20 aturan tambahan."},
        )

    normalized_facilities: list[dict] = []
    facility_names: set[str] = set()
    for index, item in enumerate(facilities):
        name = str(_payload_value(item, "name")).strip()[:120]
        category = str(
            _payload_value(item, "category", "Fasilitas lainnya")
        ).strip()[:120]
        normalized_name = name.casefold()
        if not name or not category:
            raise validation_error(
                "Fasilitas tambahan belum lengkap.",
                {f"customFacilities.{index}": "Nama dan kategori wajib diisi."},
            )
        if normalized_name in facility_names:
            raise validation_error(
                "Fasilitas tambahan tidak boleh duplikat.",
                {f"customFacilities.{index}.name": "Gunakan nama fasilitas yang berbeda."},
            )
        facility_names.add(normalized_name)
        normalized_facilities.append({"name": name, "category": category})

    normalized_rules: list[dict] = []
    rule_names: set[str] = set()
    for index, item in enumerate(rules):
        name = str(_payload_value(item, "name")).strip()[:200]
        normalized_name = name.casefold()
        if not name:
            raise validation_error(
                "Aturan tambahan belum lengkap.",
                {f"customRules.{index}.name": "Nama aturan wajib diisi."},
            )
        if normalized_name in rule_names:
            raise validation_error(
                "Aturan tambahan tidak boleh duplikat.",
                {f"customRules.{index}.name": "Gunakan aturan yang berbeda."},
            )
        rule_names.add(normalized_name)
        normalized_rules.append({"name": name})
    return normalized_facilities, normalized_rules


def normalize_payment_terms(value: object) -> dict:
    terms = {
        "dp_percentage": int(_payload_value(value, "dpPercentage", 30) or 0),
        "service_fee": int(_payload_value(value, "serviceFee", 0) or 0),
        "admin_fee": int(_payload_value(value, "adminFee", 0) or 0),
        "deposit": int(_payload_value(value, "deposit", 0) or 0),
        "discount_percentage": int(_payload_value(value, "discountPercentage", 0) or 0),
    }
    fields: dict[str, str] = {}
    if not 0 <= terms["dp_percentage"] <= 100:
        fields["paymentTerms.dpPercentage"] = "DP harus antara 0 dan 100 persen."
    if not 0 <= terms["discount_percentage"] <= 100:
        fields["paymentTerms.discountPercentage"] = "Diskon harus antara 0 dan 100 persen."
    for field in ("service_fee", "admin_fee", "deposit"):
        if terms[field] < 0:
            fields[f"paymentTerms.{field}"] = "Biaya tidak boleh negatif."
    if fields:
        raise validation_error("Rincian pembayaran belum valid.", fields)
    return terms


def normalize_durations(values: list[str]) -> list[str]:
    durations = list(dict.fromkeys(str(value).strip() for value in values))
    invalid = [value for value in durations if value not in RENTAL_DURATIONS]
    if invalid:
        raise validation_error(
            "Pilihan durasi sewa tidak valid.",
            {"rentalDurations": "Gunakan pilihan durasi yang tersedia."},
        )
    return durations


def validate_owner_listing(values: dict) -> dict:
    normalized = dict(values)
    text_fields = (
        "title",
        "city",
        "address",
        "address_notes",
        "description",
        "room_type_name",
        "room_size",
        "image_url",
        "image_alt",
    )
    for field in text_fields:
        normalized[field] = str(normalized.get(field) or "").strip()

    fields: dict[str, str] = {}
    if not normalized["title"]:
        fields["title"] = "Nama kos wajib diisi agar draft mudah dikenali."
    normalized["tag"] = str(normalized.get("tag") or "").strip().title()
    if normalized["tag"] not in OWNER_TAGS:
        fields["tag"] = "Tipe kos harus Putra, Putri, atau Campur."

    normalized["monthly_price"] = int(normalized.get("monthly_price") or 0)
    normalized["total_rooms"] = int(normalized.get("total_rooms") or 0)
    normalized["available_rooms"] = int(normalized.get("available_rooms") or 0)
    if normalized["monthly_price"] < 0:
        fields["monthlyPrice"] = "Harga bulanan tidak boleh negatif."
    if normalized["total_rooms"] < 0:
        fields["totalRooms"] = "Jumlah kamar tidak boleh negatif."
    if normalized["available_rooms"] < 0:
        fields["availableRooms"] = "Kamar tersedia tidak boleh negatif."
    if normalized["available_rooms"] > normalized["total_rooms"]:
        fields["availableRooms"] = "Kamar tersedia tidak boleh melebihi total kamar."

    latitude = normalized.get("latitude")
    longitude = normalized.get("longitude")
    if (latitude is None) != (longitude is None):
        fields["coordinates"] = "Latitude dan longitude harus diisi bersama."
    if latitude is not None and not -90 <= float(latitude) <= 90:
        fields["latitude"] = "Latitude harus berada di antara -90 dan 90."
    if longitude is not None and not -180 <= float(longitude) <= 180:
        fields["longitude"] = "Longitude harus berada di antara -180 dan 180."

    if fields:
        raise validation_error("Data kos belum valid.", fields)
    return normalized


def listing_completion(listing: dict) -> dict:
    media = listing.get("media") or []
    media_categories = {
        str(item.get("category", ""))
        for item in media
        if item.get("type") == "image"
    }
    checks = [
        ("Identitas dan kota", bool(listing.get("title") and listing.get("city"))),
        ("Alamat lengkap", bool(listing.get("address"))),
        (
            "Titik peta",
            listing.get("latitude") is not None and listing.get("longitude") is not None,
        ),
        (
            "Tipe dan ukuran kamar",
            bool(listing.get("roomTypeName") and listing.get("roomSize")),
        ),
        (
            "Harga dan jumlah kamar",
            int(listing.get("monthlyPrice") or 0) > 0
            and int(listing.get("totalRooms") or 0) > 0
            and int(listing.get("availableRooms") or 0)
            <= int(listing.get("totalRooms") or 0),
        ),
        ("Deskripsi minimal 60 karakter", len(str(listing.get("description") or "")) >= 60),
        ("Minimal 3 foto", len([item for item in media if item.get("type") == "image"]) >= 3),
        ("Foto kamar, kamar mandi, dan bangunan", (
            "bedroom" in media_categories
            and "bathroom" in media_categories
            and bool({"building", "exterior"} & media_categories)
        )),
        (
            "Minimal 3 fasilitas",
            len(listing.get("facilityIds") or [])
            + len(listing.get("customFacilities") or [])
            >= 3,
        ),
        (
            "Aturan kos",
            bool(listing.get("ruleIds")) or bool(listing.get("customRules")),
        ),
        ("Pilihan durasi sewa", bool(listing.get("rentalDurations"))),
    ]
    completed = sum(1 for _, is_complete in checks if is_complete)
    return {
        "percent": round(completed / len(checks) * 100),
        "completed": completed,
        "total": len(checks),
        "missing": [label for label, is_complete in checks if not is_complete],
    }


def _listing_from_row(row: dict) -> dict:
    listing = {
        "id": int(row["id"]),
        "title": row["title"],
        "city": row["city"],
        "monthlyPrice": int(row["monthly_price"]),
        "rating": float(row["rating"]),
        "tag": row["tag"],
        "address": row["address"],
        "addressNotes": row["address_notes"],
        "description": row["description"],
        "roomTypeName": row["room_type_name"],
        "roomSize": row["room_size"],
        "totalRooms": int(row["total_rooms"]),
        "availableRooms": int(row["available_rooms"]),
        "ownerName": row["owner_name"],
        "imageUrl": row["image_url"],
        "imageAlt": row["image_alt"],
        "latitude": float(row["latitude"]) if row["latitude"] is not None else None,
        "longitude": float(row["longitude"]) if row["longitude"] is not None else None,
        "media": row["media"] or [],
        "facilityIds": [int(value) for value in (row["facility_ids"] or [])],
        "ruleIds": [int(value) for value in (row["rule_ids"] or [])],
        "customFacilities": row["custom_facilities"] or [],
        "customRules": row["custom_rules"] or [],
        "rentalDurations": row["rental_durations"] or [],
        "paymentTerms": row["payment_terms"] or {
            "dpPercentage": 30,
            "serviceFee": 0,
            "adminFee": 0,
            "deposit": 0,
            "discountPercentage": 0,
        },
        "status": row["moderation_status"],
        "reviewNotes": row["review_notes"],
        "submittedAt": row["submitted_at"],
        "reviewedAt": row["reviewed_at"],
        "publishedAt": row["published_at"],
        "lastInventoryUpdate": row["last_inventory_update"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }
    listing["completion"] = listing_completion(listing)
    return listing


def _create_values(payload: OwnerListingCreatePayload, media: list[dict]) -> dict:
    cover = media[0] if media else None
    return validate_owner_listing(
        {
            "title": payload.title,
            "city": payload.city,
            "monthly_price": payload.monthlyPrice,
            "tag": payload.tag,
            "address": payload.address,
            "address_notes": payload.addressNotes,
            "description": payload.description,
            "room_type_name": payload.roomTypeName,
            "room_size": payload.roomSize,
            "total_rooms": payload.totalRooms,
            "available_rooms": payload.availableRooms,
            "image_url": cover["url"] if cover else payload.imageUrl,
            "image_alt": cover["alt"] if cover else payload.imageAlt,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
        }
    )


async def _validate_catalog_ids(
    connection: object,
    facility_ids: list[int],
    rule_ids: list[int],
) -> tuple[list[int], list[int]]:
    facilities = list(dict.fromkeys(int(value) for value in facility_ids))
    rules = list(dict.fromkeys(int(value) for value in rule_ids))
    if any(value <= 0 for value in [*facilities, *rules]):
        raise validation_error("Pilihan fasilitas atau aturan tidak valid.")

    valid_facilities: set[int] = set()
    if facilities:
        facility_rows = await connection.fetch(
            "select id from facility_catalog where id = any($1::bigint[])",
            facilities,
        )
        valid_facilities = {int(row["id"]) for row in facility_rows}

    valid_rules: set[int] = set()
    if rules:
        rule_rows = await connection.fetch(
            "select id from rule_catalog where id = any($1::bigint[])",
            rules,
        )
        valid_rules = {int(row["id"]) for row in rule_rows}
    if valid_facilities != set(facilities) or valid_rules != set(rules):
        raise validation_error(
            "Sebagian pilihan fasilitas atau aturan tidak tersedia lagi.",
            {"catalog": "Muat ulang halaman lalu pilih kembali."},
        )
    return facilities, rules


async def _replace_related_content(
    connection: object,
    listing_id: int,
    media: list[dict],
    facility_ids: list[int],
    rule_ids: list[int],
    custom_facilities: list[dict],
    custom_rules: list[dict],
    durations: list[str],
    payment_terms: dict,
) -> None:
    facility_ids, rule_ids = await _validate_catalog_ids(
        connection,
        facility_ids,
        rule_ids,
    )

    await connection.execute("delete from kos_media where kos_id = $1", listing_id)
    for index, item in enumerate(media):
        await connection.execute(
            """
            insert into kos_media (
              kos_id, id, category, label, type, url, thumbnail_url, alt, sort_order
            ) values ($1, $2, $3, $4, $5::media_type, $6, $7, $8, $9)
            """,
            listing_id,
            item["id"],
            item["category"],
            item["label"],
            item["type"],
            item["url"],
            item["thumbnail_url"],
            item["alt"],
            index + 1,
        )

    await connection.execute(
        "delete from kos_facility_assignments where kos_id = $1",
        listing_id,
    )
    for index, facility_id in enumerate(facility_ids):
        await connection.execute(
            """
            insert into kos_facility_assignments (
              kos_id, facility_id, is_highlighted, sort_order, highlight_sort_order
            ) values ($1, $2, $3, $4, $5)
            """,
            listing_id,
            facility_id,
            index < 6,
            index + 1,
            index + 1 if index < 6 else None,
        )

    await connection.execute(
        "delete from kos_rule_assignments where kos_id = $1",
        listing_id,
    )
    for index, rule_id in enumerate(rule_ids):
        await connection.execute(
            """
            insert into kos_rule_assignments (kos_id, rule_id, sort_order)
            values ($1, $2, $3)
            """,
            listing_id,
            rule_id,
            index + 1,
        )

    await connection.execute(
        "delete from kos_custom_facilities where kos_id = $1",
        listing_id,
    )
    for index, custom in enumerate(custom_facilities):
        await connection.execute(
            """
            insert into kos_custom_facilities (kos_id, category, name, sort_order)
            values ($1, $2, $3, $4)
            """,
            listing_id,
            custom["category"],
            custom["name"],
            index + 1,
        )

    await connection.execute(
        "delete from kos_custom_rules where kos_id = $1",
        listing_id,
    )
    for index, custom in enumerate(custom_rules):
        await connection.execute(
            """
            insert into kos_custom_rules (kos_id, name, sort_order)
            values ($1, $2, $3)
            """,
            listing_id,
            custom["name"],
            index + 1,
        )

    await connection.execute(
        "delete from kos_rental_durations where kos_id = $1",
        listing_id,
    )
    for index, duration in enumerate(durations):
        await connection.execute(
            """
            insert into kos_rental_durations (kos_id, duration, sort_order)
            values ($1, $2::rental_duration, $3)
            """,
            listing_id,
            duration,
            index + 1,
        )

    await connection.execute(
        """
        insert into kos_payment_terms (
          kos_id, dp_percentage, service_fee, admin_fee, deposit,
          discount_percentage
        ) values ($1, $2, $3, $4, $5, $6)
        on conflict (kos_id) do update set
          dp_percentage = excluded.dp_percentage,
          service_fee = excluded.service_fee,
          admin_fee = excluded.admin_fee,
          deposit = excluded.deposit,
          discount_percentage = excluded.discount_percentage
        """,
        listing_id,
        payment_terms["dp_percentage"],
        payment_terms["service_fee"],
        payment_terms["admin_fee"],
        payment_terms["deposit"],
        payment_terms["discount_percentage"],
    )


async def _owner_request_rows(owner_id: int) -> tuple[list, list, list]:
    return await asyncio.gather(
        db.fetch(
            """
            select request.id, request.kos_id, listing.title as kos_title,
                   renter.full_name as renter_name, renter.phone_number,
                   renter.email, request.scheduled_for, request.visitor_type,
                   request.visitor_name, request.visitor_phone,
                   request.relationship, request.notes, request.status,
                   request.created_at
            from survey_requests request
            join kos_listings listing on listing.id = request.kos_id
            join users renter on renter.id = request.renter_id
            where listing.owner_user_id = $1 order by request.created_at desc
            """,
            owner_id,
        ),
        db.fetch(
            """
            select request.id, request.kos_id, listing.title as kos_title,
                   renter.full_name as renter_name, renter.phone_number,
                   renter.email, request.message, request.preferred_contact_method,
                   request.status, request.created_at
            from contact_requests request
            join kos_listings listing on listing.id = request.kos_id
            join users renter on renter.id = request.renter_id
            where listing.owner_user_id = $1 order by request.created_at desc
            """,
            owner_id,
        ),
        db.fetch(
            """
            select request.id, request.kos_id, listing.title as kos_title,
                   renter.full_name as renter_name, renter.phone_number,
                   renter.email, request.rental_months, request.payment_method,
                   request.quoted_total, request.move_in_date, request.notes,
                   request.status, request.created_at
            from rental_applications request
            join kos_listings listing on listing.id = request.kos_id
            join users renter on renter.id = request.renter_id
            where listing.owner_user_id = $1 order by request.created_at desc
            """,
            owner_id,
        ),
    )


async def get_owner_dashboard(user: dict) -> dict:
    require_verified_owner(user)
    summary, listings, request_rows, facilities, rules = await asyncio.gather(
        db.fetchrow(
            """
            select
              count(*) as total_listings,
              count(*) filter (where moderation_status = 'published') as published_listings,
              coalesce(sum(available_rooms) filter (where moderation_status <> 'archived'), 0)
                as available_rooms,
              (
                (select count(*) from survey_requests request
                 join kos_listings listing on listing.id = request.kos_id
                 where listing.owner_user_id = $1 and request.status in ('pending', 'confirmed'))
                + (select count(*) from contact_requests request
                   join kos_listings listing on listing.id = request.kos_id
                   where listing.owner_user_id = $1 and request.status = 'open')
                + (select count(*) from rental_applications request
                   join kos_listings listing on listing.id = request.kos_id
                   where listing.owner_user_id = $1 and request.status in ('submitted', 'reviewing'))
              ) as open_requests
            from kos_listings where owner_user_id = $1
            """,
            user["id"],
        ),
        db.fetch(
            f"{OWNER_LISTING_SELECT} where listing.owner_user_id = $1 "
            "order by listing.updated_at desc, listing.id desc",
            user["id"],
        ),
        _owner_request_rows(user["id"]),
        db.fetch(
            """
            select facility.id, facility.name, category.id as category_id,
                   category.title as category_title
            from facility_catalog facility
            join facility_categories category on category.id = facility.category_id
            order by category.sort_order, facility.name
            """
        ),
        db.fetch("select id, name from rule_catalog order by name"),
    )
    surveys, contacts, rentals = request_rows
    return {
        "summary": {
            "totalListings": int(summary["total_listings"]),
            "publishedListings": int(summary["published_listings"]),
            "availableRooms": int(summary["available_rooms"]),
            "openRequests": int(summary["open_requests"]),
            "pendingRequests": int(summary["open_requests"]),
        },
        "listings": [_listing_from_row(row) for row in listings],
        "setupOptions": {
            "facilities": [
                {
                    "id": int(row["id"]),
                    "name": row["name"],
                    "categoryId": row["category_id"],
                    "categoryTitle": row["category_title"],
                }
                for row in facilities
            ],
            "rules": [
                {"id": int(row["id"]), "name": row["name"]}
                for row in rules
            ],
        },
        "surveys": [dict(row) for row in surveys],
        "contacts": [dict(row) for row in contacts],
        "rentals": [dict(row) for row in rentals],
    }


async def get_owner_inbox(user: dict) -> dict:
    dashboard = await get_owner_dashboard(user)
    return {
        **dashboard,
        "listings": [
            {
                "id": listing["id"],
                "title": listing["title"],
                "available_rooms": listing["availableRooms"],
                "status": listing["status"],
            }
            for listing in dashboard["listings"]
        ],
    }


async def create_owner_listing(user: dict, payload: OwnerListingCreatePayload) -> dict:
    require_verified_owner(user)
    media = normalize_media(payload.media)
    if not media and payload.imageUrl.strip():
        media = normalize_media(
            [
                {
                    "id": "cover",
                    "category": "bedroom",
                    "label": "Foto utama",
                    "type": "image",
                    "url": payload.imageUrl,
                    "alt": payload.imageAlt or payload.title,
                }
            ]
        )
    values = _create_values(payload, media)
    durations = normalize_durations(payload.rentalDurations)
    payment_terms = normalize_payment_terms(payload.paymentTerms)
    custom_facilities, custom_rules = normalize_custom_content(
        payload.customFacilities,
        payload.customRules,
    )

    async with db.connection() as connection, connection.transaction():
        row = await connection.fetchrow(
            """
            insert into kos_listings (
              title, city, monthly_price, rating, tag, address, address_notes,
              description, room_type_name, room_size, total_rooms,
              available_rooms, owner_name, owner_user_id, image_url, image_alt,
              is_featured, latitude, longitude, moderation_status,
              last_inventory_update
            ) values (
              $1, $2, $3, 0, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
              $14, $15, false, $16, $17, 'draft', now()
            )
            returning id
            """,
            values["title"],
            values["city"],
            values["monthly_price"],
            values["tag"],
            values["address"],
            values["address_notes"],
            values["description"],
            values["room_type_name"],
            values["room_size"],
            values["total_rooms"],
            values["available_rooms"],
            user["fullName"],
            user["id"],
            values["image_url"],
            values["image_alt"],
            values["latitude"],
            values["longitude"],
        )
        listing_id = int(row["id"])
        await _replace_related_content(
            connection,
            listing_id,
            media,
            payload.facilityIds,
            payload.ruleIds,
            custom_facilities,
            custom_rules,
            durations,
            payment_terms,
        )

    listing = await db.fetchrow(
        f"{OWNER_LISTING_SELECT} where listing.id = $1 and listing.owner_user_id = $2",
        listing_id,
        user["id"],
    )
    return _listing_from_row(listing)


async def update_owner_listing(
    user: dict,
    listing_id: int,
    payload: OwnerListingUpdatePayload,
) -> dict:
    require_verified_owner(user)
    current_row = await db.fetchrow(
        f"{OWNER_LISTING_SELECT} where listing.id = $1 and listing.owner_user_id = $2",
        listing_id,
        user["id"],
    )
    if current_row is None:
        raise not_found("Kos tidak ditemukan untuk akun pemilik ini.")
    current = _listing_from_row(current_row)
    if current["status"] == "archived":
        raise validation_error("Kos yang sudah diarsipkan tidak dapat diubah.")
    if not payload.model_fields_set:
        raise validation_error("Tidak ada perubahan kos yang dikirim.")

    scalar_map = {
        "title": "title",
        "city": "city",
        "monthlyPrice": "monthly_price",
        "tag": "tag",
        "address": "address",
        "addressNotes": "address_notes",
        "description": "description",
        "roomTypeName": "room_type_name",
        "roomSize": "room_size",
        "totalRooms": "total_rooms",
        "availableRooms": "available_rooms",
        "imageUrl": "image_url",
        "imageAlt": "image_alt",
        "latitude": "latitude",
        "longitude": "longitude",
    }
    values = {
        "title": current["title"],
        "city": current["city"],
        "monthly_price": current["monthlyPrice"],
        "tag": current["tag"],
        "address": current["address"],
        "address_notes": current["addressNotes"],
        "description": current["description"],
        "room_type_name": current["roomTypeName"],
        "room_size": current["roomSize"],
        "total_rooms": current["totalRooms"],
        "available_rooms": current["availableRooms"],
        "image_url": current["imageUrl"],
        "image_alt": current["imageAlt"],
        "latitude": current["latitude"],
        "longitude": current["longitude"],
    }
    for payload_field in payload.model_fields_set & scalar_map.keys():
        values[scalar_map[payload_field]] = getattr(payload, payload_field)

    media = (
        normalize_media(payload.media or [])
        if "media" in payload.model_fields_set
        else normalize_media(current["media"])
    )
    if "media" in payload.model_fields_set:
        values["image_url"] = media[0]["url"] if media else ""
        values["image_alt"] = media[0]["alt"] if media else ""
    values = validate_owner_listing(values)

    if "rentalDurations" in payload.model_fields_set:
        raw_durations = payload.rentalDurations or []
    else:
        raw_durations = current["rentalDurations"]
    durations = normalize_durations(raw_durations)
    payment_terms = normalize_payment_terms(
        payload.paymentTerms
        if "paymentTerms" in payload.model_fields_set
        else current["paymentTerms"]
    )
    if "facilityIds" in payload.model_fields_set:
        facility_ids: list[int] = payload.facilityIds or []
    else:
        facility_ids = current["facilityIds"]
    if "ruleIds" in payload.model_fields_set:
        rule_ids: list[int] = payload.ruleIds or []
    else:
        rule_ids = current["ruleIds"]
    if "customFacilities" in payload.model_fields_set:
        raw_custom_facilities = payload.customFacilities or []
    else:
        raw_custom_facilities = current["customFacilities"]
    if "customRules" in payload.model_fields_set:
        raw_custom_rules = payload.customRules or []
    else:
        raw_custom_rules = current["customRules"]
    custom_facilities, custom_rules = normalize_custom_content(
        raw_custom_facilities,
        raw_custom_rules,
    )

    async with db.connection() as connection, connection.transaction():
        await connection.execute(
            """
            update kos_listings
            set title = $1, city = $2, monthly_price = $3, tag = $4,
                address = $5, address_notes = $6, description = $7,
                room_type_name = $8, room_size = $9, total_rooms = $10,
                available_rooms = $11, owner_name = $12, image_url = $13,
                image_alt = $14, latitude = $15, longitude = $16,
                moderation_status = 'draft', review_notes = '',
                submitted_at = null, reviewed_at = null, reviewed_by = null,
                published_at = null, last_inventory_update = case
                  when available_rooms <> $11 or total_rooms <> $10 then now()
                  else last_inventory_update
                end,
                updated_at = now()
            where id = $17 and owner_user_id = $18
            """,
            values["title"],
            values["city"],
            values["monthly_price"],
            values["tag"],
            values["address"],
            values["address_notes"],
            values["description"],
            values["room_type_name"],
            values["room_size"],
            values["total_rooms"],
            values["available_rooms"],
            user["fullName"],
            values["image_url"],
            values["image_alt"],
            values["latitude"],
            values["longitude"],
            listing_id,
            user["id"],
        )
        await _replace_related_content(
            connection,
            listing_id,
            media,
            facility_ids,
            rule_ids,
            custom_facilities,
            custom_rules,
            durations,
            payment_terms,
        )

    listing = await db.fetchrow(
        f"{OWNER_LISTING_SELECT} where listing.id = $1 and listing.owner_user_id = $2",
        listing_id,
        user["id"],
    )
    return _listing_from_row(listing)


async def submit_owner_listing(user: dict, listing_id: int) -> dict:
    require_verified_owner(user)
    current_row = await db.fetchrow(
        f"{OWNER_LISTING_SELECT} where listing.id = $1 and listing.owner_user_id = $2",
        listing_id,
        user["id"],
    )
    if current_row is None:
        raise not_found("Kos tidak ditemukan untuk akun pemilik ini.")
    current = _listing_from_row(current_row)
    validate_submission_status(current["status"])
    completion = current["completion"]
    if completion["percent"] < 100:
        raise validation_error(
            "Listing belum siap diajukan.",
            {"listing": "Lengkapi: " + ", ".join(completion["missing"]) + "."},
        )

    await db.execute(
        """
        update kos_listings
        set moderation_status = 'pending', submitted_at = now(),
            review_notes = '', reviewed_at = null, reviewed_by = null,
            updated_at = now()
        where id = $1 and owner_user_id = $2
        """,
        listing_id,
        user["id"],
    )
    row = await db.fetchrow(
        f"{OWNER_LISTING_SELECT} where listing.id = $1 and listing.owner_user_id = $2",
        listing_id,
        user["id"],
    )
    return _listing_from_row(row)


async def update_owner_availability(user: dict, listing_id: int, available_rooms: int) -> dict:
    require_verified_owner(user)
    if available_rooms < 0:
        raise validation_error(
            "Jumlah kamar tersedia tidak valid.",
            {"availableRooms": "Jumlah kamar tidak boleh negatif."},
        )
    row = await db.fetchrow(
        """
        update kos_listings
        set available_rooms = $1, last_inventory_update = now(), updated_at = now()
        where id = $2 and owner_user_id = $3
          and moderation_status <> 'archived' and total_rooms >= $1
        returning id
        """,
        available_rooms,
        listing_id,
        user["id"],
    )
    if row is None:
        raise validation_error(
            "Jumlah kamar tersedia melebihi total kamar atau kos tidak ditemukan.",
            {"availableRooms": "Periksa total kamar pada data listing."},
        )
    listing = await db.fetchrow(
        f"{OWNER_LISTING_SELECT} where listing.id = $1 and listing.owner_user_id = $2",
        listing_id,
        user["id"],
    )
    return _listing_from_row(listing)


async def update_owner_request(user: dict, request_type: str, request_id: int, status: str) -> dict:
    require_verified_owner(user)
    definition = REQUEST_TYPES.get(request_type)
    if definition is None or status not in definition["statuses"]:
        raise validation_error("Status permintaan tidak valid.")

    row = await db.fetchrow(
        f"""
        update {definition['table']} request set status = $1, updated_at = now()
        from kos_listings listing
        where request.id = $2 and request.kos_id = listing.id
          and listing.owner_user_id = $3
        returning request.id, request.status
        """,
        status,
        request_id,
        user["id"],
    )
    if row is None:
        raise not_found("Permintaan tidak ditemukan untuk akun pemilik ini.")
    return dict(row)
