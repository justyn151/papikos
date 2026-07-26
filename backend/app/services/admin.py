import asyncio

from ..database import db
from ..errors import ApiError, not_found, validation_error
from .auth import require_role
from .owner import listing_completion


LISTING_STATUSES = {"draft", "pending", "published", "rejected", "archived"}
VERIFICATION_STATUSES = {"not_required", "pending", "verified", "rejected"}
REVIEWED_LISTING_STATUSES = {"published", "rejected", "archived"}


def validate_listing_review(status: str, review_notes: str) -> tuple[str, str]:
    normalized_status = status.strip().lower()
    notes = review_notes.strip()[:2000]
    if normalized_status not in LISTING_STATUSES:
        raise validation_error("Status moderasi kos tidak valid.", {"status": "Pilih status yang tersedia."})
    if normalized_status == "rejected" and not notes:
        raise validation_error(
            "Alasan penolakan wajib diisi.",
            {"reviewNotes": "Jelaskan hal yang perlu diperbaiki pemilik."},
        )
    return normalized_status, notes


def validate_verification_status(role: str, verification_status: str) -> str:
    normalized = verification_status.strip().lower()
    if normalized not in VERIFICATION_STATUSES:
        raise validation_error(
            "Status verifikasi tidak valid.",
            {"verificationStatus": "Pilih status yang tersedia."},
        )
    if role != "pemilik-kos" and normalized != "not_required":
        raise validation_error("Verifikasi hanya berlaku untuk akun pemilik kos.")
    return normalized


def validate_publishable_owner(
    owner_user_id: int | None,
    owner_is_active: bool | None,
    owner_verification_status: str | None,
) -> None:
    if (
        owner_user_id is None
        or not owner_is_active
        or owner_verification_status != "verified"
    ):
        raise validation_error(
            "Kos hanya dapat diterbitkan untuk pemilik yang aktif dan terverifikasi.",
            {"status": "Verifikasi dan aktifkan akun pemilik terlebih dahulu."},
        )


def _user_from_row(row: dict) -> dict:
    return {
        "id": int(row["id"]),
        "fullName": row["full_name"],
        "phoneNumber": row["phone_number"],
        "email": row["email"],
        "role": row["role"],
        "isActive": bool(row["is_active"]),
        "verificationStatus": row["verification_status"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def _listing_from_row(row: dict) -> dict:
    listing = {
        "id": int(row["id"]),
        "title": row["title"],
        "city": row["city"],
        "monthlyPrice": int(row["monthly_price"]),
        "tag": row["tag"],
        "address": row["address"],
        "addressNotes": row["address_notes"],
        "description": row["description"],
        "roomTypeName": row["room_type_name"],
        "roomSize": row["room_size"],
        "totalRooms": int(row["total_rooms"]),
        "availableRooms": int(row["available_rooms"]),
        "imageUrl": row["image_url"],
        "imageAlt": row["image_alt"],
        "latitude": float(row["latitude"]) if row["latitude"] is not None else None,
        "longitude": float(row["longitude"]) if row["longitude"] is not None else None,
        "media": row["media"] or [],
        "facilities": row["facilities"] or [],
        "facilityIds": [int(value) for value in (row["facility_ids"] or [])],
        "customFacilities": row["custom_facilities"] or [],
        "rules": row["rules"] or [],
        "ruleIds": [int(value) for value in (row["rule_ids"] or [])],
        "customRules": row["custom_rules"] or [],
        "rentalDurations": row["rental_durations"] or [],
        "paymentTerms": row["payment_terms"] or {
            "dpPercentage": 30,
            "serviceFee": 0,
            "adminFee": 0,
            "deposit": 0,
            "discountPercentage": 0,
        },
        "ownerUserId": int(row["owner_user_id"]) if row["owner_user_id"] is not None else None,
        "ownerName": row["owner_full_name"] or row["owner_name"],
        "ownerEmail": row["owner_email"] or "",
        "ownerIsActive": bool(row["owner_is_active"]) if row["owner_is_active"] is not None else False,
        "ownerVerificationStatus": row["owner_verification_status"] or "not_required",
        "status": row["moderation_status"],
        "reviewNotes": row["review_notes"],
        "submittedAt": row["submitted_at"],
        "reviewedAt": row["reviewed_at"],
        "reviewedBy": row["reviewed_by"],
        "publishedAt": row["published_at"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }
    listing["completion"] = listing_completion(listing)
    return listing


ADMIN_LISTING_SELECT = """
select listing.id, listing.title, listing.city, listing.monthly_price, listing.tag,
       listing.address, listing.address_notes, listing.description,
       listing.room_type_name, listing.room_size, listing.total_rooms,
       listing.available_rooms, listing.image_url, listing.image_alt,
       listing.latitude, listing.longitude, listing.owner_user_id, listing.owner_name,
       owner_account.full_name as owner_full_name, owner_account.email as owner_email,
       owner_account.is_active as owner_is_active,
       owner_account.verification_status as owner_verification_status,
       listing.moderation_status,
       listing.review_notes, listing.submitted_at, listing.reviewed_at,
       reviewer.full_name as reviewed_by, listing.published_at,
       listing.created_at, listing.updated_at,
       (
         select coalesce(
           json_agg(
             json_build_object(
               'id', media.id, 'category', media.category, 'label', media.label,
               'type', media.type, 'url', media.url,
               'thumbnailUrl', media.thumbnail_url, 'alt', media.alt
             ) order by media.sort_order
           ),
           '[]'::json
         )
         from kos_media media where media.kos_id = listing.id
       ) as media,
       (
         select coalesce(json_agg(facility.name order by assignment.sort_order), '[]'::json)
         from kos_facility_assignments assignment
         join facility_catalog facility on facility.id = assignment.facility_id
         where assignment.kos_id = listing.id
       ) as facilities,
       (
         select coalesce(json_agg(assignment.facility_id order by assignment.sort_order), '[]'::json)
         from kos_facility_assignments assignment where assignment.kos_id = listing.id
       ) as facility_ids,
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
         select coalesce(json_agg(catalog.name order by assignment.sort_order), '[]'::json)
         from kos_rule_assignments assignment
         join rule_catalog catalog on catalog.id = assignment.rule_id
         where assignment.kos_id = listing.id
       ) as rules,
       (
         select coalesce(json_agg(assignment.rule_id order by assignment.sort_order), '[]'::json)
         from kos_rule_assignments assignment where assignment.kos_id = listing.id
       ) as rule_ids,
       (
         select coalesce(
           json_agg(
             json_build_object('id', custom.id, 'name', custom.name)
             order by custom.sort_order, custom.id
           ),
           '[]'::json
         )
         from kos_custom_rules custom where custom.kos_id = listing.id
       ) as custom_rules,
       (
         select coalesce(json_agg(duration.duration order by duration.sort_order), '[]'::json)
         from kos_rental_durations duration where duration.kos_id = listing.id
       ) as rental_durations,
       (
         select json_build_object(
           'dpPercentage', terms.dp_percentage,
           'serviceFee', terms.service_fee,
           'adminFee', terms.admin_fee,
           'deposit', terms.deposit,
           'discountPercentage', terms.discount_percentage
         )
         from kos_payment_terms terms where terms.kos_id = listing.id
       ) as payment_terms
from kos_listings listing
left join users owner_account on owner_account.id = listing.owner_user_id
left join users reviewer on reviewer.id = listing.reviewed_by
"""


async def get_admin_dashboard(user: dict) -> dict:
    require_role(user, "admin", "Fitur ini hanya tersedia untuk admin.")
    summary, users, listings, surveys, contacts, rentals = await asyncio.gather(
        db.fetchrow(
            """
            select
              (select count(*) from users) as total_users,
              (select count(*) from users where role = 'pemilik-kos') as total_owners,
              (select count(*) from kos_listings) as total_listings,
              (select count(*) from kos_listings where moderation_status = 'pending')
                as pending_listings,
              (
                (select count(*) from survey_requests where status in ('pending', 'confirmed'))
                + (select count(*) from contact_requests where status = 'open')
                + (select count(*) from rental_applications where status in ('submitted', 'reviewing'))
              ) as open_requests
            """
        ),
        db.fetch(
            """
            select id, full_name, phone_number, email, role, is_active,
                   verification_status, created_at, updated_at
            from users order by created_at desc, id desc
            """
        ),
        db.fetch(f"{ADMIN_LISTING_SELECT} order by listing.updated_at desc, listing.id desc"),
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
            order by request.created_at desc
            """
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
            order by request.created_at desc
            """
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
            order by request.created_at desc
            """
        ),
    )
    return {
        "summary": {
            "totalUsers": int(summary["total_users"]),
            "totalOwners": int(summary["total_owners"]),
            "totalListings": int(summary["total_listings"]),
            "pendingListings": int(summary["pending_listings"]),
            "openRequests": int(summary["open_requests"]),
        },
        "users": [_user_from_row(row) for row in users],
        "listings": [_listing_from_row(row) for row in listings],
        "requests": {
            "surveys": [dict(row) for row in surveys],
            "contacts": [dict(row) for row in contacts],
            "rentals": [dict(row) for row in rentals],
        },
    }


async def update_admin_listing(
    user: dict,
    listing_id: int,
    status: str,
    review_notes: str,
) -> dict:
    require_role(user, "admin", "Fitur ini hanya tersedia untuk admin.")
    moderation_status, notes = validate_listing_review(status, review_notes)
    current_row = await db.fetchrow(
        f"{ADMIN_LISTING_SELECT} where listing.id = $1",
        listing_id,
    )
    if current_row is None:
        raise not_found("Kos tidak ditemukan.")
    current = _listing_from_row(current_row)
    if moderation_status == "published":
        validate_publishable_owner(
            current["ownerUserId"],
            current["ownerIsActive"],
            current["ownerVerificationStatus"],
        )
    reviewed = moderation_status in REVIEWED_LISTING_STATUSES
    row = await db.fetchrow(
        """
        update kos_listings
        set moderation_status = $1::listing_moderation_status,
            review_notes = $2,
            submitted_at = case
              when $1::listing_moderation_status = 'pending'
                then coalesce(submitted_at, now())
              else submitted_at
            end,
            reviewed_at = case when $3::boolean then now() else null end,
            reviewed_by = case when $3::boolean then $4::bigint else null end,
            published_at = case
              when $1::listing_moderation_status = 'published'
                then coalesce(published_at, now())
              else published_at
            end,
            updated_at = now()
        where id = $5
        returning id
        """,
        moderation_status,
        notes,
        reviewed,
        user["id"],
        listing_id,
    )
    listing = await db.fetchrow(f"{ADMIN_LISTING_SELECT} where listing.id = $1", listing_id)
    return _listing_from_row(listing)


async def update_admin_user(
    admin: dict,
    user_id: int,
    is_active: bool | None,
    verification_status: str | None,
) -> dict:
    require_role(admin, "admin", "Fitur ini hanya tersedia untuk admin.")
    target = await db.fetchrow(
        """
        select id, full_name, phone_number, email, role, is_active,
               verification_status, created_at, updated_at
        from users where id = $1
        """,
        user_id,
    )
    if target is None:
        raise not_found("Akun tidak ditemukan.")
    if is_active is None and verification_status is None:
        raise validation_error("Pilih perubahan akun terlebih dahulu.")
    if user_id == admin["id"] and is_active is False:
        raise ApiError(403, "Admin tidak dapat menonaktifkan akunnya sendiri.", "FORBIDDEN")

    next_active = bool(target["is_active"]) if is_active is None else is_active
    next_verification = target["verification_status"]
    if verification_status is not None:
        next_verification = validate_verification_status(target["role"], verification_status)

    updated = await db.fetchrow(
        """
        update users set is_active = $1, verification_status = $2, updated_at = now()
        where id = $3
        returning id, full_name, phone_number, email, role, is_active,
                  verification_status, created_at, updated_at
        """,
        next_active,
        next_verification,
        user_id,
    )
    if not next_active:
        await db.execute("delete from user_sessions where user_id = $1", user_id)
    return _user_from_row(updated)
