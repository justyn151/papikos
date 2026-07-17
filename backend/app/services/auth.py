import logging
import re
from datetime import timedelta
from urllib.parse import quote

import asyncpg
from fastapi import Request, Response

from ..config import settings
from ..database import db
from ..errors import ApiError, validation_error
from ..schemas import (
    ForgotPasswordPayload,
    LoginPayload,
    RegisterPayload,
    ResetPasswordPayload,
)
from ..security import (
    create_token,
    hash_password,
    hash_token,
    normalize_phone_number,
    verify_password,
)


LOGGER = logging.getLogger(__name__)
COOKIE_NAME = "papikos_session"
ALLOWED_ROLES = {"pencari-kos", "pemilik-kos"}


def _public_user(row: asyncpg.Record) -> dict:
    return {
        "id": int(row["id"]),
        "fullName": row["full_name"],
        "phoneNumber": row["phone_number"],
        "email": row["email"],
        "role": row["role"],
    }


async def create_session(user_id: int, response: Response) -> None:
    token = create_token()
    await db.execute(
        """
        insert into user_sessions (token_hash, user_id, expires_at)
        values ($1, $2, now() + ($3 * interval '1 day'))
        """,
        hash_token(token),
        user_id,
        settings.session_days,
    )
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=int(timedelta(days=settings.session_days).total_seconds()),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


async def delete_session(request: Request, response: Response) -> None:
    token = request.cookies.get(COOKIE_NAME)
    if token:
        await db.execute("delete from user_sessions where token_hash = $1", hash_token(token))
    response.delete_cookie(
        COOKIE_NAME,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


async def get_session_user(request: Request) -> dict | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    row = await db.fetchrow(
        """
        select user_account.id, user_account.full_name, user_account.phone_number,
               user_account.email, user_account.role
        from user_sessions session
        join users user_account on user_account.id = session.user_id
        where session.token_hash = $1 and session.expires_at > now()
        limit 1
        """,
        hash_token(token),
    )
    return _public_user(row) if row else None


async def register_user(payload: RegisterPayload) -> dict:
    full_name = payload.fullName.strip()
    phone_number = normalize_phone_number(payload.phoneNumber)
    email = payload.email.strip().lower()
    password = payload.password
    role = payload.role
    fields: dict[str, str] = {}

    if not full_name:
        fields["fullName"] = "Nama lengkap wajib diisi."
    if not phone_number:
        fields["phoneNumber"] = "Nomor handphone wajib diisi."
    elif not phone_number.startswith("08") or not 10 <= len(phone_number) <= 13:
        fields["phoneNumber"] = "Nomor handphone Indonesia belum valid."
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        fields["email"] = "Email belum valid."
    if len(password) < 8:
        fields["password"] = "Password minimal 8 karakter."
    if role not in ALLOWED_ROLES:
        fields["role"] = "Role tidak valid."
    if fields:
        raise validation_error("Data pendaftaran belum valid.", fields)

    password_hash, password_salt = hash_password(password)
    try:
        async with db.connection() as connection, connection.transaction():
            row = await connection.fetchrow(
                """
                insert into users (
                  full_name, phone_number, email, password_hash, password_salt, role
                ) values ($1, $2, $3, $4, $5, $6)
                returning id, full_name, phone_number, email, role
                """,
                full_name,
                phone_number,
                email,
                password_hash,
                password_salt,
                role,
            )
            if role == "pemilik-kos":
                await connection.execute(
                    """
                    update kos_listings set owner_user_id = $1
                    where owner_user_id is null and lower(owner_name) = lower($2)
                    """,
                    row["id"],
                    full_name,
                )
    except asyncpg.UniqueViolationError as error:
        raise validation_error(
            "Akun sudah terdaftar.",
            {"account": "Email atau nomor handphone sudah dipakai."},
        ) from error
    return _public_user(row)


async def login_user(payload: LoginPayload) -> dict:
    phone_number = normalize_phone_number(payload.phoneNumber)
    if not phone_number or not payload.password:
        raise validation_error("Nomor handphone dan password wajib diisi.")
    if payload.role and payload.role not in ALLOWED_ROLES:
        raise validation_error("Role tidak valid.", {"role": "Role tidak valid."})

    row = await db.fetchrow(
        """
        select id, full_name, phone_number, email, role, password_hash, password_salt
        from users where phone_number = $1 limit 1
        """,
        phone_number,
    )
    if row is None or not verify_password(payload.password, row["password_salt"], row["password_hash"]):
        raise validation_error("Nomor handphone atau password salah.")
    if payload.role and row["role"] != payload.role:
        raise validation_error("Akun ini tidak sesuai dengan role yang dipilih.")
    return _public_user(row)


def _normalize_identifier(value: str) -> str:
    identifier = value.strip().lower()
    return identifier if "@" in identifier else normalize_phone_number(identifier)


async def request_password_reset(payload: ForgotPasswordPayload) -> dict:
    identifier = _normalize_identifier(payload.identifier)
    if not identifier:
        raise validation_error("Masukkan email atau nomor handphone.")
    row = await db.fetchrow(
        "select id from users where email = $1 or phone_number = $1 limit 1",
        identifier,
    )
    if row is None:
        return {}

    token = create_token()
    async with db.connection() as connection, connection.transaction():
        await connection.execute(
            "delete from password_reset_tokens where user_id = $1 or expires_at <= now()",
            row["id"],
        )
        await connection.execute(
            """
            insert into password_reset_tokens (token_hash, user_id, expires_at)
            values ($1, $2, now() + interval '30 minutes')
            """,
            hash_token(token),
            row["id"],
        )

    reset_path = f"/reset-password?token={quote(token)}"
    LOGGER.info("Papikos password reset link: %s%s", settings.public_app_url, reset_path)
    return {"resetPath": reset_path} if settings.expose_reset_token else {}


async def reset_password(payload: ResetPasswordPayload) -> None:
    if not payload.token:
        raise validation_error("Token reset tidak tersedia.")
    if len(payload.password) < 8:
        raise validation_error(
            "Password minimal 8 karakter.",
            {"password": "Password minimal 8 karakter."},
        )

    async with db.connection() as connection, connection.transaction():
        token_row = await connection.fetchrow(
            """
            select user_id from password_reset_tokens
            where token_hash = $1 and used_at is null and expires_at > now()
            for update
            """,
            hash_token(payload.token),
        )
        if token_row is None:
            raise validation_error("Tautan reset sudah tidak berlaku. Minta tautan baru.")
        password_hash, password_salt = hash_password(payload.password)
        await connection.execute(
            """
            update users set password_hash = $1, password_salt = $2, updated_at = now()
            where id = $3
            """,
            password_hash,
            password_salt,
            token_row["user_id"],
        )
        await connection.execute(
            "update password_reset_tokens set used_at = now() where token_hash = $1",
            hash_token(payload.token),
        )
        await connection.execute(
            "delete from user_sessions where user_id = $1",
            token_row["user_id"],
        )


def require_role(user: dict, role: str, message: str) -> None:
    if user["role"] != role:
        raise ApiError(403, message, "FORBIDDEN")
