import { roomEffectivePrice } from "@/features/home/home-utils";
import type {
  BookingRequest,
  Listing,
  ListingDetail,
} from "@/features/listings/types";

/**
 * Papikos reports what an owner earns; it never collects or holds money.
 * Figures derive from approved booking requests and published prices, so a
 * discounted room reduces earnings automatically.
 */
export const PLATFORM_COMMISSION_RATE = 0.05;

export interface EarningsSummary {
  gross: number;
  commission: number;
  net: number;
  bookingCount: number;
}

export interface OccupancySummary {
  totalRooms: number;
  freeRooms: number;
  occupiedRooms: number;
  /** Whole percent, 0 when the owner has no rooms at all. */
  rate: number;
}

export interface DemandSummary {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  /** Share of decided requests that were approved, or null if none decided. */
  approvalRate: number | null;
}

function sameMonth(iso: string, month: Date): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return false;
  return (
    date.getFullYear() === month.getFullYear() &&
    date.getMonth() === month.getMonth()
  );
}

/** When the booking reached its current status, falling back to creation. */
function decidedAt(booking: BookingRequest): string {
  const last = booking.statusHistory[booking.statusHistory.length - 1];
  return last?.at ?? booking.createdAt;
}

export function monthlyEarnings(
  bookings: BookingRequest[],
  detailFor: (listingId: string) => ListingDetail | undefined,
  month: Date = new Date(),
): EarningsSummary {
  // Only approved bookings represent money an owner is actually due.
  const approved = bookings.filter(
    (booking) =>
      booking.status === "approved" && sameMonth(decidedAt(booking), month),
  );

  const gross = approved.reduce((total, booking) => {
    const listing = detailFor(booking.listingId);
    const room = listing?.rooms.find((item) => item.id === booking.roomId);
    if (!listing || !room) return total;
    return total + roomEffectivePrice(listing, room.price);
  }, 0);

  const commission = Math.round(gross * PLATFORM_COMMISSION_RATE);

  return {
    gross,
    commission,
    net: gross - commission,
    bookingCount: approved.length,
  };
}

export function occupancy(listings: ListingDetail[]): OccupancySummary {
  const totalRooms = listings.reduce(
    (total, listing) =>
      total + listing.rooms.reduce((count) => count + 1, 0),
    0,
  );
  const freeRooms = listings.reduce(
    (total, listing) =>
      total +
      listing.rooms.reduce((count, room) => count + (room.availableRooms > 0 ? 1 : 0), 0),
    0,
  );
  const occupiedRooms = totalRooms - freeRooms;

  return {
    totalRooms,
    freeRooms,
    occupiedRooms,
    rate: totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100),
  };
}

export function demand(
  bookings: BookingRequest[],
  month: Date = new Date(),
): DemandSummary {
  const thisMonth = bookings.filter((booking) =>
    sameMonth(booking.createdAt, month),
  );
  const approved = thisMonth.filter((b) => b.status === "approved").length;
  const rejected = thisMonth.filter((b) => b.status === "rejected").length;
  const pending = thisMonth.filter((b) => b.status === "pending").length;
  const decided = approved + rejected;

  return {
    total: thisMonth.length,
    approved,
    rejected,
    pending,
    approvalRate: decided === 0 ? null : Math.round((approved / decided) * 100),
  };
}

/** Listings visible to renters that have no free rooms — worth surfacing. */
export function fullyBookedListings(listings: Listing[]): Listing[] {
  return listings.filter((listing) => listing.availableRooms === 0);
}
