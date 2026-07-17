from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import asyncpg

from ..config import settings
from ..database import db
from ..errors import not_found, validation_error
from ..payments import calculate_payment_quote
from ..schemas import ContactPayload, RentalPayload, SurveyPayload
from ..security import normalize_phone_number
from .auth import require_role
from .listings import get_listing


def _as_dict(row: asyncpg.Record) -> dict:
    return dict(row)


def _scheduled_utc(value: datetime | None) -> datetime:
    if value is None:
        raise validation_error(
            "Pilih tanggal dan jam survei terlebih dahulu.",
            {"scheduledFor": "Waktu survei wajib diisi."},
        )
    if value.tzinfo is None:
        value = value.replace(tzinfo=ZoneInfo(settings.app_timezone))
    scheduled = value.astimezone(timezone.utc)
    if scheduled < datetime.now(timezone.utc) + timedelta(hours=2):
        raise validation_error(
            "Jadwal survei terlalu mendadak.",
            {"scheduledFor": "Pilih waktu minimal dua jam dari sekarang."},
        )
    return scheduled


async def create_survey_request(user: dict, kos_id: int, payload: SurveyPayload) -> dict:
    require_role(user, "pencari-kos", "Fitur ini hanya tersedia untuk pencari kos.")
    scheduled_for = _scheduled_utc(payload.scheduledFor)
    visitor_type = payload.visitorType
    notes = payload.notes.strip()[:1000]

    if visitor_type == "self":
        visitor_name = user["fullName"]
        visitor_phone = user["phoneNumber"]
        relationship = ""
    elif visitor_type == "representative":
        visitor_name = payload.representativeName.strip()
        visitor_phone = normalize_phone_number(payload.representativePhone)
        relationship = payload.relationship.strip()
        fields = {}
        if not visitor_name:
            fields["representativeName"] = "Nama pengunjung wajib diisi."
        if not visitor_phone.startswith("08") or not 10 <= len(visitor_phone) <= 13:
            fields["representativePhone"] = "Nomor handphone pengunjung belum valid."
        if not relationship:
            fields["relationship"] = "Hubungan dengan pemohon wajib diisi."
        if fields:
            raise validation_error("Identitas orang yang mewakili survei belum lengkap.", fields)
    else:
        raise validation_error("Pilihan pengunjung survei tidak valid.")

    try:
        row = await db.fetchrow(
            """
            insert into survey_requests (
              renter_id, kos_id, scheduled_for, visitor_type, visitor_name,
              visitor_phone, relationship, notes
            ) values ($1, $2, $3, $4, $5, $6, $7, $8)
            returning id, kos_id, scheduled_for, visitor_type, visitor_name,
                      visitor_phone, relationship, notes, status, created_at
            """,
            user["id"],
            kos_id,
            scheduled_for,
            visitor_type,
            visitor_name,
            visitor_phone,
            relationship,
            notes,
        )
    except asyncpg.ForeignKeyViolationError as error:
        raise not_found("Kos tidak ditemukan.") from error
    return _as_dict(row)


async def create_contact_request(user: dict, kos_id: int, payload: ContactPayload) -> dict:
    require_role(user, "pencari-kos", "Fitur ini hanya tersedia untuk pencari kos.")
    message = payload.message.strip()[:2000]
    method = payload.preferredContactMethod
    if len(message) < 10:
        raise validation_error(
            "Pertanyaan belum cukup jelas.",
            {"message": "Tulis pertanyaan minimal 10 karakter."},
        )
    if method not in {"chat", "whatsapp", "phone"}:
        raise validation_error("Preferensi balasan tidak valid.")
    try:
        row = await db.fetchrow(
            """
            insert into contact_requests (
              renter_id, kos_id, message, preferred_contact_method
            ) values ($1, $2, $3, $4)
            returning id, kos_id, message, preferred_contact_method, status, created_at
            """,
            user["id"],
            kos_id,
            message,
            method,
        )
    except asyncpg.ForeignKeyViolationError as error:
        raise not_found("Kos tidak ditemukan.") from error
    return _as_dict(row)


async def create_payment_quote(kos_id: int, rental_months: int, payment_method: str) -> dict:
    listing = await get_listing(kos_id)
    return calculate_payment_quote(listing, rental_months, payment_method)


async def create_rental_application(user: dict, kos_id: int, payload: RentalPayload) -> dict:
    require_role(user, "pencari-kos", "Fitur ini hanya tersedia untuk pencari kos.")
    if payload.moveInDate is None:
        raise validation_error(
            "Pilih rencana tanggal masuk.",
            {"moveInDate": "Tanggal masuk wajib diisi."},
        )
    local_today = datetime.now(ZoneInfo(settings.app_timezone)).date()
    if payload.moveInDate < local_today + timedelta(days=1):
        raise validation_error(
            "Rencana tanggal masuk belum valid.",
            {"moveInDate": "Tanggal masuk paling cepat besok."},
        )

    quote = await create_payment_quote(kos_id, payload.rentalMonths, payload.paymentMethod)
    notes = payload.notes.strip()[:1000]
    row = await db.fetchrow(
        """
        insert into rental_applications (
          renter_id, kos_id, rental_months, payment_method, quoted_total,
          quote_snapshot, move_in_date, notes
        ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
        returning id, kos_id, rental_months, payment_method, quoted_total,
                  move_in_date, notes, status, created_at
        """,
        user["id"],
        kos_id,
        quote["rentalMonths"],
        quote["paymentMethod"],
        quote["total"],
        quote,
        payload.moveInDate,
        notes,
    )
    return {**_as_dict(row), "quote": quote}


async def get_my_activity(user: dict) -> dict:
    require_role(user, "pencari-kos", "Fitur ini hanya tersedia untuk pencari kos.")
    async with db.connection() as connection:
        surveys = await connection.fetch(
            """
            select request.id, request.kos_id, listing.title as kos_title,
                   request.scheduled_for, request.visitor_type, request.visitor_name,
                   request.visitor_phone, request.relationship, request.notes,
                   request.status, request.created_at
            from survey_requests request
            join kos_listings listing on listing.id = request.kos_id
            where request.renter_id = $1 order by request.created_at desc
            """,
            user["id"],
        )
        contacts = await connection.fetch(
            """
            select request.id, request.kos_id, listing.title as kos_title,
                   request.message, request.preferred_contact_method,
                   request.status, request.created_at
            from contact_requests request
            join kos_listings listing on listing.id = request.kos_id
            where request.renter_id = $1 order by request.created_at desc
            """,
            user["id"],
        )
        rentals = await connection.fetch(
            """
            select request.id, request.kos_id, listing.title as kos_title,
                   request.rental_months, request.payment_method, request.quoted_total,
                   request.move_in_date, request.notes, request.status, request.created_at
            from rental_applications request
            join kos_listings listing on listing.id = request.kos_id
            where request.renter_id = $1 order by request.created_at desc
            """,
            user["id"],
        )
    return {
        "surveys": [dict(row) for row in surveys],
        "contacts": [dict(row) for row in contacts],
        "rentals": [dict(row) for row in rentals],
    }
