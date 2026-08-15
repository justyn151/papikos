export type Locale = "id" | "en";

export type LocalizedText = Record<Locale, string>;

export type ListingType = "putra" | "putri" | "campur";

export type ListingTypeFilter = ListingType | "all";

export type Amenity =
  | "wifi"
  | "ac"
  | "privateBathroom"
  | "motorParking"
  | "kitchen"
  | "laundry";

export interface Listing {
  id: string;
  name: string;
  city: string;
  district: string;
  type: ListingType;
  price: number;
  amenities: Amenity[];
  availableRooms: number;
  verified: boolean;
  tone: string;
  accent: string;
}

export type GalleryCategory =
  | "room"
  | "bathroom"
  | "shared"
  | "exterior"
  | "neighborhood";

export interface GalleryItem {
  id: string;
  category: GalleryCategory;
  label: LocalizedText;
  variant: number;
}

export interface RoomOption {
  id: string;
  name: LocalizedText;
  size: string;
  price: number;
  availableRooms: number;
  bathroom: "private" | "shared";
  furnishings: LocalizedText[];
}

export interface CostItem {
  id: string;
  label: LocalizedText;
  amount: number | null;
  included: boolean;
  note?: LocalizedText;
}

export interface FacilityItem {
  id: string;
  label: LocalizedText;
  category: "room" | "shared" | "service" | "security" | "parking";
}

export interface HouseRule {
  id: string;
  label: LocalizedText;
  allowed: boolean;
}

export interface Landmark {
  id: string;
  name: string;
  kind: "campus" | "transit" | "shopping" | "health";
  distanceKm: number;
  travelMinutes: number;
}

export interface ListingQuestion {
  id: string;
  question: LocalizedText;
  answer?: LocalizedText;
  status: "answered" | "pending";
}

export interface ListingDetail extends Listing {
  description: LocalizedText;
  updatedAt: string;
  availableFrom: string;
  minimumStayMonths: number;
  approximateArea: string;
  privacyRadiusMeters: number;
  ownerName: string;
  ownerSince: number;
  gallery: GalleryItem[];
  rooms: RoomOption[];
  costs: CostItem[];
  facilities: FacilityItem[];
  rules: HouseRule[];
  landmarks: Landmark[];
  questions: ListingQuestion[];
  verification: {
    identity: boolean;
    property: boolean;
    checkedAt: string;
  };
}

/** Who performed an action in the prototype's role-switching model. */
export type PrototypeRole = "renter" | "owner" | "admin";

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface BookingStatusChange {
  status: BookingStatus;
  at: string;
  by: PrototypeRole;
}

export interface BookingRequest {
  id: string;
  listingId: string;
  roomId: string;
  moveInDate: string;
  durationMonths: number;
  note: string;
  status: BookingStatus;
  /** Full history is preserved rather than overwritten on each change. */
  statusHistory: BookingStatusChange[];
  createdAt: string;
}

export type QuestionStatus = "pending" | "answered";

export interface SubmittedQuestion {
  id: string;
  listingId: string;
  question: string;
  status: QuestionStatus;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
}

export type ReportStatus = "submitted" | "reviewing" | "resolved" | "dismissed";

export interface ListingReport {
  id: string;
  listingId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
}

/** Administrator/owner overrides layered on top of the seeded listing data. */
export interface ListingModeration {
  listingId: string;
  published: boolean;
  suspended: boolean;
  verifiedOverride: boolean | null;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  actor: PrototypeRole;
  action: string;
  targetId: string;
  at: string;
  note?: string;
}
