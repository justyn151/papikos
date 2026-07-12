from pydantic import BaseModel, Field
from typing import List, Optional

class PaymentTerms(BaseModel):
    dpPercentage: int = Field(..., description="Down payment percentage required (e.g. 30 for 30%)")
    serviceFee: int = Field(..., description="Service fee in Rupiah")
    adminFee: int = Field(..., description="Administrative booking fee in Rupiah")
    deposit: int = Field(..., description="Refundable security deposit in Rupiah")
    discountPercentage: int = Field(..., description="Discount percentage applied to the rental period")

class KosMedia(BaseModel):
    id: str = Field(..., description="Unique identifier for the media item")
    category: str = Field(..., description="Media category (e.g. Room, Exterior, Bathroom)")
    label: str = Field(..., description="Human readable label for the media item")
    type: str = Field(..., description="Type of media: 'image' or 'video'")
    url: str = Field(..., description="Full URL to the media asset")
    thumbnailUrl: Optional[str] = Field(None, description="Optional thumbnail image URL for videos")
    alt: str = Field(..., description="Alt text description for accessibility")

class FacilityCategory(BaseModel):
    id: str = Field(..., description="Category identifier (e.g. kamar, bersama)")
    title: str = Field(..., description="Display title for the facility group")
    items: List[str] = Field(..., description="List of facility names in this category")

class KosListing(BaseModel):
    id: int = Field(..., description="Unique ID of the listing")
    title: str = Field(..., description="Title of the Kos listing")
    location: str = Field(..., description="City or region name where the listing is located")
    monthlyPrice: int = Field(..., description="Standard monthly rental price in Rupiah")
    rating: float = Field(..., description="Overall user rating (out of 5.0)")
    tag: str = Field(..., description="Gender policy/tag: 'Putra', 'Putri', or 'Campur'")
    address: str = Field(..., description="Detailed street address of the property")
    description: str = Field(..., description="Detailed text description of the Kos")
    facilities: List[str] = Field(..., description="Flat list of main facility names")
    facilityCategories: List[FacilityCategory] = Field(..., description="Nested list of facilities categorized by group")
    rules: List[str] = Field(..., description="House rules and conditions")
    roomSize: str = Field(..., description="Standard room dimensions (e.g., '3 x 4 m')")
    availableRooms: int = Field(..., description="Number of currently available rooms")
    rentalDurations: List[str] = Field(..., description="Allowed billing periods (e.g., 'Bulanan', 'Tahunan')")
    owner: str = Field(..., description="Name of the property owner")
    paymentTerms: PaymentTerms = Field(..., description="Booking and financial breakdown terms")
    imageUrl: str = Field(..., description="Primary display thumbnail image URL")
    imageAlt: str = Field(..., description="Alt text for the primary thumbnail image")
    media: List[KosMedia] = Field(..., description="Complete gallery of media (images and videos)")

class Coordinates(BaseModel):
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")

class KosSearchRecord(BaseModel):
    id: int = Field(..., description="Unique ID of the search record")
    listingId: int = Field(..., description="Reference ID to the full listing")
    name: str = Field(..., description="Title of the Kos listing")
    city: str = Field(..., description="City name")
    area: str = Field(..., description="Neighborhood or area name")
    address: str = Field(..., description="Full street address")
    nearbyCampuses: List[str] = Field(..., description="List of nearby campuses")
    coordinates: Coordinates = Field(..., description="Geographical location coordinates")
    monthlyPrice: int = Field(..., description="Standard monthly price in Rupiah")
    tag: str = Field(..., description="Gender policy tag ('Putra', 'Putri', 'Campur')")

class KosSearchResult(BaseModel):
    record: KosSearchRecord = Field(..., description="Simplified search record including map coordinates")
    listing: KosListing = Field(..., description="Full details of the matched listing")

class SearchCity(BaseModel):
    city: str = Field(..., description="City name")
    campuses: List[str] = Field(..., description="List of campuses located in the city")
    areas: List[str] = Field(..., description="List of major areas/districts in the city")

class SearchableLocation(BaseModel):
    id: str = Field(..., description="Unique suggestion ID")
    label: str = Field(..., description="Display label for the suggestion dropdown")
    description: str = Field(..., description="Short helper text (e.g. 'Kampus di Yogyakarta')")
    searchValue: str = Field(..., description="Canonical value stored or queried")
    keywords: List[str] = Field(..., description="Matching keywords and search aliases")

class SearchMetadata(BaseModel):
    cities: List[SearchCity] = Field(..., description="Nested autocomplete suggestions grouped by city")
    popularCampuses: List[str] = Field(..., description="List of featured campus search buttons")
    searchableLocations: List[SearchableLocation] = Field(..., description="Flattened index of searchable campuses, areas, and cities")
