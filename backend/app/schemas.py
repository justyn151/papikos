from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


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


class AdminListingReviewPayload(Payload):
    status: str = ""
    reviewNotes: str = ""


class AdminUserUpdatePayload(Payload):
    isActive: bool | None = None
    verificationStatus: str | None = None


class OwnerMediaPayload(Payload):
    id: str = ""
    category: str = "bedroom"
    label: str = ""
    type: str = "image"
    url: str = ""
    thumbnailUrl: str | None = None
    alt: str = ""


class OwnerPaymentTermsPayload(Payload):
    dpPercentage: int = 30
    serviceFee: int = 0
    adminFee: int = 0
    deposit: int = 0
    discountPercentage: int = 0


class OwnerCustomFacilityPayload(Payload):
    id: int | None = None
    category: str = "Fasilitas lainnya"
    name: str = ""


class OwnerCustomRulePayload(Payload):
    id: int | None = None
    name: str = ""


class OwnerListingCreatePayload(Payload):
    title: str = ""
    city: str = ""
    monthlyPrice: int = 0
    tag: str = ""
    address: str = ""
    addressNotes: str = ""
    description: str = ""
    roomTypeName: str = ""
    roomSize: str = ""
    totalRooms: int = 0
    availableRooms: int = 0
    imageUrl: str = ""
    imageAlt: str = ""
    latitude: float | None = None
    longitude: float | None = None
    media: list[OwnerMediaPayload] = Field(default_factory=list)
    facilityIds: list[int] = Field(default_factory=list)
    ruleIds: list[int] = Field(default_factory=list)
    customFacilities: list[OwnerCustomFacilityPayload] = Field(default_factory=list)
    customRules: list[OwnerCustomRulePayload] = Field(default_factory=list)
    rentalDurations: list[str] = Field(default_factory=lambda: ["Bulanan"])
    paymentTerms: OwnerPaymentTermsPayload = Field(default_factory=OwnerPaymentTermsPayload)


class OwnerListingUpdatePayload(Payload):
    title: str | None = None
    city: str | None = None
    monthlyPrice: int | None = None
    tag: str | None = None
    address: str | None = None
    addressNotes: str | None = None
    description: str | None = None
    roomTypeName: str | None = None
    roomSize: str | None = None
    totalRooms: int | None = None
    availableRooms: int | None = None
    imageUrl: str | None = None
    imageAlt: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    media: list[OwnerMediaPayload] | None = None
    facilityIds: list[int] | None = None
    ruleIds: list[int] | None = None
    customFacilities: list[OwnerCustomFacilityPayload] | None = None
    customRules: list[OwnerCustomRulePayload] | None = None
    rentalDurations: list[str] | None = None
    paymentTerms: OwnerPaymentTermsPayload | None = None


class OwnerAvailabilityPayload(Payload):
    availableRooms: int = 0
