export type Locale = "id" | "en";

export type LocalizedText = Record<Locale, string>;

export type ListingType = "putra" | "putri" | "campur";

export type ListingTypeFilter = ListingType | "all";

/**
 * Every amenity is filterable, which is why the set is closed: a free-text
 * amenity typed by one owner would never match another owner's wording and
 * would silently break the facet counts in search.
 */
export type Amenity =
  // In the room
  | "ac"
  | "privateBathroom"
  | "waterHeater"
  | "wardrobe"
  | "desk"
  | "tv"
  | "balcony"
  // Shared areas
  | "kitchen"
  | "livingRoom"
  | "dryingArea"
  | "prayerRoom"
  | "fridge"
  // Services
  | "wifi"
  | "laundry"
  | "cleaning"
  | "dispenser"
  // Security
  | "cctv"
  | "securityGuard"
  | "access24"
  | "keycard"
  // Parking
  | "motorParking"
  | "carParking";

export interface Listing {
  id: string;
  name: string;
  city: string;
  district: string;
  type: ListingType;
  price: number;
  /**
   * Owner-set discounted price, or null when the kos is not discounted.
   * Every price decision (filtering, matching, sorting) must go through
   * `effectivePrice`, not `price`, or a discounted kos would be filtered out
   * by a budget it actually meets.
   */
  promoPrice: number | null;
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
  /**
   * Set only for photos the owner uploaded. When absent the gallery falls back
   * to the generated artwork, which is what every seeded listing uses.
   */
  dataUrl?: string;
}

/** An owner-uploaded photo, stored inline as a downscaled JPEG data URL. */
export interface ListingPhoto {
  id: string;
  dataUrl: string;
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

/**
 * A room as its owner edits it. Owners write one room name, not a translation
 * pair, so the text here is single-language and only becomes `LocalizedText`
 * when it is merged — where a name left untouched keeps the seeded translation.
 */
export interface OverrideRoom {
  id: string;
  name: string;
  size: string;
  price: number;
  availableRooms: number;
  bathroom: "private" | "shared";
  furnishings: string[];
}

/** An owner's edit to one of the seeded cost rows. */
export interface OverrideCost {
  id: string;
  amount: number | null;
  included: boolean;
  /**
   * Why the charge exists, in the owner's words. An empty string clears the
   * seeded explanation; absent means the seeded one stands.
   */
  note?: string;
  /**
   * A seeded row the owner does not charge. Kept as a tombstone rather than
   * dropped from the list, so an absent entry still means "unchanged".
   */
  removed?: boolean;
}

/** A cost row the owner added, alongside the seeded ones. */
export interface CustomCost {
  id: string;
  label: string;
  amount: number | null;
  included: boolean;
  /**
   * The only explanation an owner-added charge can have: there is no seeded
   * copy to fall back on for a fee Papikos has never heard of.
   */
  note?: string;
}

/**
 * Owner edits layered over the seeded listing data. Every field is optional;
 * an absent field means "keep whatever the seed says", which is what lets a
 * reset be a simple delete rather than a restore.
 */
export interface ListingOverride {
  listingId: string;
  name?: string;
  description?: string;
  /**
   * Derived from the rooms rather than typed: the headline is the cheapest
   * room's rate, so a card can never advertise a price no room actually
   * offers. Recomputed on read, so a hand-edited record cannot disagree.
   */
  price?: number;
  /** Derived from `discountPercent`; kept so every price consumer is unchanged. */
  promoPrice?: number | null;
  /**
   * What the owner actually decided: a whole-percent discount, or null for
   * none. Storing the percentage rather than the discounted amount is what
   * makes the "-15%" badge exact and the same cut apply to every room.
   */
  discountPercent?: number | null;
  type?: ListingType;
  city?: string;
  district?: string;
  approximateArea?: string;
  privacyRadiusMeters?: number;
  availableFrom?: string;
  minimumStayMonths?: number;
  amenities?: Amenity[];
  /** Uploaded photos, cover first. An empty array means "no photos". */
  photos?: ListingPhoto[];
  rules?: { id: string; allowed: boolean }[];
  /**
   * Rules the owner wrote themselves, added to the standard set rather than
   * replacing it. Free text is safe here because rules are only ever
   * displayed — unlike amenities, nothing filters on them.
   */
  customRules?: { id: string; label: string; allowed: boolean }[];
  /**
   * The listing's rooms in full, not a patch: owners add and remove rooms, and
   * a patch keyed by seeded id cannot express either. Present means "these are
   * the rooms"; absent still means "keep the seeded ones".
   */
  rooms?: OverrideRoom[];
  costs?: OverrideCost[];
  customCosts?: CustomCost[];
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
