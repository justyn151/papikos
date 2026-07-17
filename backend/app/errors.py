class ApiError(Exception):
    def __init__(
        self,
        status: int,
        message: str,
        code: str = "ERROR",
        fields: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.message = message
        self.code = code
        self.fields = fields


def validation_error(message: str, fields: dict[str, str] | None = None) -> ApiError:
    return ApiError(400, message, "VALIDATION_ERROR", fields)


def not_found(message: str = "Data tidak ditemukan.") -> ApiError:
    return ApiError(404, message, "NOT_FOUND")


def forbidden(message: str = "Kamu tidak memiliki akses ke fitur ini.") -> ApiError:
    return ApiError(403, message, "FORBIDDEN")


def unauthenticated() -> ApiError:
    return ApiError(401, "Silakan masuk terlebih dahulu.", "UNAUTHENTICATED")
