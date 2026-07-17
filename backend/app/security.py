import hashlib
import hmac
import re
import secrets


PASSWORD_ITERATIONS = 120_000
PASSWORD_KEY_LENGTH = 64


def normalize_phone_number(value: object) -> str:
    digits = re.sub(r"\D", "", str(value or ""))
    return f"0{digits[2:]}" if digits.startswith("62") else digits


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha512",
        password.encode(),
        password_salt.encode(),
        PASSWORD_ITERATIONS,
        PASSWORD_KEY_LENGTH,
    )
    return digest.hex(), password_salt


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    actual_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(actual_hash, expected_hash)


def create_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
