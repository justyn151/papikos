import asyncio

from ..database import db
from ..errors import not_found, validation_error
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


async def get_owner_inbox(user: dict) -> dict:
    require_role(user, "pemilik-kos", "Fitur ini hanya tersedia untuk pemilik kos.")
    await db.execute(
        """
        update kos_listings set owner_user_id = $1
        where owner_user_id is null and lower(owner_name) = lower($2)
        """,
        user["id"],
        user["fullName"],
    )

    listings, surveys, contacts, rentals = await asyncio.gather(
        db.fetch(
            """
            select id, title, available_rooms from kos_listings
            where owner_user_id = $1 order by id
            """,
            user["id"],
        ),
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
            user["id"],
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
            user["id"],
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
            user["id"],
        ),
    )
    return {
        "listings": [dict(row) for row in listings],
        "surveys": [dict(row) for row in surveys],
        "contacts": [dict(row) for row in contacts],
        "rentals": [dict(row) for row in rentals],
    }


async def update_owner_request(user: dict, request_type: str, request_id: int, status: str) -> dict:
    require_role(user, "pemilik-kos", "Fitur ini hanya tersedia untuk pemilik kos.")
    definition = REQUEST_TYPES.get(request_type)
    if definition is None or status not in definition["statuses"]:
        raise validation_error("Status permintaan tidak valid.")

    # The table is selected only from the closed map above; values remain bound.
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
