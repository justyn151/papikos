import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Path, Query, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import db
from .errors import ApiError, unauthenticated
from .filters import parse_optional_integer
from .schemas import (
    ContactPayload,
    ForgotPasswordPayload,
    LoginPayload,
    OwnerStatusPayload,
    PaymentQuotePayload,
    RegisterPayload,
    RentalPayload,
    ResetPasswordPayload,
    SurveyPayload,
)
from .services.actions import (
    create_contact_request,
    create_payment_quote,
    create_rental_application,
    create_survey_request,
    get_my_activity,
)
from .services.auth import (
    create_session,
    delete_session,
    get_session_user,
    login_user,
    register_user,
    request_password_reset,
    reset_password,
)
from .services.listings import (
    get_listing,
    get_search_metadata,
    list_listings,
    parse_filters,
    search_listings,
)
from .services.owner import get_owner_inbox, update_owner_request


LOGGER = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await db.connect()
    yield
    await db.disconnect()


app = FastAPI(
    title="Papikos Backend API",
    version="1.0.0",
    description="FastAPI backend for Papikos listing, account, and rental workflows.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ApiError)
async def api_error_handler(_: Request, error: ApiError) -> JSONResponse:
    body: dict[str, object] = {"code": error.code, "message": error.message}
    if error.fields:
        body["fields"] = error.fields
    return JSONResponse(status_code=error.status, content=body)


@app.exception_handler(RequestValidationError)
async def request_validation_handler(_: Request, error: RequestValidationError) -> JSONResponse:
    fields = {
        ".".join(str(part) for part in issue["loc"] if part != "body"): issue["msg"]
        for issue in error.errors()
    }
    return JSONResponse(
        status_code=400,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Format data permintaan belum valid.",
            "fields": fields,
        },
    )


@app.exception_handler(Exception)
async def unexpected_error_handler(_: Request, error: Exception) -> JSONResponse:
    LOGGER.exception("Unhandled Papikos API error", exc_info=error)
    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_SERVER_ERROR",
            "message": "Terjadi kesalahan pada server.",
        },
    )


async def require_user(request: Request) -> dict:
    user = await get_session_user(request)
    if user is None:
        raise unauthenticated()
    return user


@app.get("/api/health", tags=["System"])
async def health() -> dict:
    row = await db.fetchrow("select 1 as ok")
    return {"ok": bool(row and row["ok"] == 1)}


@app.get("/api/kos/search", tags=["Search"])
async def search_kos(
    query: str = Query(""),
    tags: str | None = Query(None),
    duration: str | None = Query(None),
    min_price: str | None = Query(None, alias="minPrice"),
    max_price: str | None = Query(None, alias="maxPrice"),
    facilities: str | None = Query(None),
    rules: str | None = Query(None),
    available_only: bool = Query(False, alias="availableOnly"),
    sort: str = Query("recommended"),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
) -> list[dict]:
    coordinates = (lat, lng) if lat is not None and lng is not None else None
    filters = parse_filters(
        tags,
        duration,
        parse_optional_integer(min_price, "minPrice"),
        parse_optional_integer(max_price, "maxPrice"),
        facilities,
        rules,
        available_only,
        sort,
    )
    return await search_listings(query, filters, coordinates)


@app.get("/api/kos", tags=["Listings"])
async def get_kos(featured: bool | None = Query(None)) -> list[dict]:
    return await list_listings(featured)


@app.get("/api/kos/{kos_id}", tags=["Listings"])
async def get_kos_by_id(kos_id: int = Path(..., gt=0)) -> dict:
    return await get_listing(kos_id)


@app.post("/api/kos/{kos_id}/payment-quote", tags=["Payments"])
async def payment_quote(kos_id: int, payload: PaymentQuotePayload) -> dict:
    return await create_payment_quote(kos_id, payload.rentalMonths, payload.paymentMethod)


@app.post("/api/kos/{kos_id}/surveys", status_code=status.HTTP_201_CREATED, tags=["Renter"])
async def request_survey(
    kos_id: int,
    payload: SurveyPayload,
    user: dict = Depends(require_user),
) -> dict:
    return {"survey": await create_survey_request(user, kos_id, payload)}


@app.post("/api/kos/{kos_id}/contact-requests", status_code=status.HTTP_201_CREATED, tags=["Renter"])
async def request_contact(
    kos_id: int,
    payload: ContactPayload,
    user: dict = Depends(require_user),
) -> dict:
    return {"contact": await create_contact_request(user, kos_id, payload)}


@app.post("/api/kos/{kos_id}/rental-applications", status_code=status.HTTP_201_CREATED, tags=["Renter"])
async def rental_application(
    kos_id: int,
    payload: RentalPayload,
    user: dict = Depends(require_user),
) -> dict:
    return {"rental": await create_rental_application(user, kos_id, payload)}


@app.get("/api/me/activity", tags=["Renter"])
async def my_activity(user: dict = Depends(require_user)) -> dict:
    return await get_my_activity(user)


@app.get("/api/owner/inbox", tags=["Owner"])
async def owner_inbox(user: dict = Depends(require_user)) -> dict:
    return await get_owner_inbox(user)


@app.patch("/api/owner/requests/{request_type}/{request_id}", tags=["Owner"])
async def owner_request_status(
    payload: OwnerStatusPayload,
    request_type: str,
    request_id: int,
    user: dict = Depends(require_user),
) -> dict:
    return {
        "request": await update_owner_request(
            user,
            request_type,
            request_id,
            payload.status,
        )
    }


@app.get("/api/search/metadata", tags=["Search"])
async def search_metadata() -> dict:
    return await get_search_metadata()


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register(payload: RegisterPayload, response: Response) -> dict:
    user = await register_user(payload)
    await create_session(user["id"], response)
    return {"user": user}


@app.post("/api/auth/login", tags=["Authentication"])
async def login(payload: LoginPayload, response: Response) -> dict:
    user = await login_user(payload)
    await create_session(user["id"], response)
    return {"user": user}


@app.get("/api/auth/me", tags=["Authentication"])
async def current_user(request: Request) -> dict:
    return {"user": await get_session_user(request)}


@app.post("/api/auth/logout", status_code=status.HTTP_204_NO_CONTENT, tags=["Authentication"])
async def logout(request: Request, response: Response) -> Response:
    await delete_session(request, response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@app.post("/api/auth/forgot-password", tags=["Authentication"])
async def forgot_password(payload: ForgotPasswordPayload) -> dict:
    result = await request_password_reset(payload)
    return {
        "message": "Jika akun ditemukan, petunjuk reset password telah dibuat.",
        **result,
    }


@app.post("/api/auth/reset-password", tags=["Authentication"])
async def update_password(payload: ResetPasswordPayload) -> dict:
    await reset_password(payload)
    return {"message": "Password berhasil diperbarui. Silakan masuk kembali."}
