from .errors import validation_error


def parse_optional_integer(value: str | None, field_name: str) -> int | None:
    normalized_value = (value or "").strip()
    if not normalized_value:
        return None

    try:
        return int(normalized_value)
    except ValueError as error:
        raise validation_error(
            "Filter harga belum valid.",
            {field_name: "Gunakan angka Rupiah tanpa tanda baca."},
        ) from error
