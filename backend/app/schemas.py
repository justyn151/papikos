from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class Payload(BaseModel):
    model_config = ConfigDict(extra="ignore")


class RegisterPayload(Payload):
    fullName: str = ""
    phoneNumber: str = ""
    email: str = ""
    password: str = ""
    role: str = ""


class LoginPayload(Payload):
    phoneNumber: str = ""
    password: str = ""
    role: str | None = None


class ForgotPasswordPayload(Payload):
    identifier: str = ""


class ResetPasswordPayload(Payload):
    token: str = ""
    password: str = ""


class PaymentQuotePayload(Payload):
    rentalMonths: int = 1
    paymentMethod: str = "full"


class SurveyPayload(Payload):
    scheduledFor: datetime | None = None
    visitorType: str = "self"
    representativeName: str = ""
    representativePhone: str = ""
    relationship: str = ""
    notes: str = ""


class ContactPayload(Payload):
    message: str = ""
    preferredContactMethod: str = "chat"


class RentalPayload(Payload):
    rentalMonths: int = 1
    paymentMethod: str = "full"
    moveInDate: date | None = None
    notes: str = ""


class OwnerStatusPayload(Payload):
    status: str = ""
