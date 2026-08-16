import { describe, expect, it } from "vitest";

import { getListingDetail } from "@/features/listings/mock-listings";
import type { BookingRequest, ListingDetail } from "@/features/listings/types";

import {
  PLATFORM_COMMISSION_RATE,
  demand,
  monthlyEarnings,
  occupancy,
} from "./owner-earnings";

const listing = getListingDetail("senja-setiabudi")!;
const room = listing.rooms[0];
const month = new Date("2026-08-15T00:00:00.000Z");

const detailFor = (id: string) => getListingDetail(id);

function booking(patch: Partial<BookingRequest> = {}): BookingRequest {
  const at = "2026-08-10T00:00:00.000Z";
  return {
    id: `booking-${Math.random()}`,
    listingId: listing.id,
    roomId: room.id,
    moveInDate: "2026-09-01",
    durationMonths: 3,
    note: "",
    status: "approved",
    statusHistory: [
      { status: "pending", at, by: "renter" },
      { status: "approved", at, by: "owner" },
    ],
    createdAt: at,
    ...patch,
  };
}

describe("owner earnings", () => {
  it("counts only approved bookings", () => {
    const summary = monthlyEarnings(
      [
        booking(),
        booking({ status: "pending", statusHistory: [] }),
        booking({ status: "rejected" }),
        booking({ status: "cancelled" }),
      ],
      detailFor,
      month,
    );

    expect(summary.bookingCount).toBe(1);
    expect(summary.gross).toBe(room.price);
  });

  it("deducts the platform commission from gross", () => {
    const summary = monthlyEarnings([booking()], detailFor, month);

    expect(summary.commission).toBe(
      Math.round(summary.gross * PLATFORM_COMMISSION_RATE),
    );
    expect(summary.net).toBe(summary.gross - summary.commission);
    // Reporting only: the net is what the owner collects directly.
    expect(summary.net).toBeLessThan(summary.gross);
  });

  it("earns less on a discounted room", () => {
    const discounted: ListingDetail = {
      ...listing,
      promoPrice: listing.price - 400_000,
    };
    const summary = monthlyEarnings(
      [booking()],
      (id) => (id === listing.id ? discounted : undefined),
      month,
    );

    expect(summary.gross).toBe(room.price - 400_000);
  });

  it("ignores bookings approved in another month", () => {
    const old = "2026-07-10T00:00:00.000Z";
    const summary = monthlyEarnings(
      [
        booking({
          createdAt: old,
          statusHistory: [
            { status: "pending", at: old, by: "renter" },
            { status: "approved", at: old, by: "owner" },
          ],
        }),
      ],
      detailFor,
      month,
    );

    expect(summary.bookingCount).toBe(0);
    expect(summary.gross).toBe(0);
  });

  it("skips a booking whose listing or room no longer exists", () => {
    const summary = monthlyEarnings(
      [booking({ roomId: "does-not-exist" }), booking({ listingId: "gone" })],
      detailFor,
      month,
    );

    expect(summary.gross).toBe(0);
  });
});

describe("occupancy", () => {
  it("reports zero rather than dividing by zero with no rooms", () => {
    expect(occupancy([])).toMatchObject({ totalRooms: 0, rate: 0 });
  });

  it("counts a room with no free places as occupied", () => {
    const full: ListingDetail = {
      ...listing,
      rooms: listing.rooms.map((item) => ({ ...item, availableRooms: 0 })),
    };

    expect(occupancy([full])).toMatchObject({
      freeRooms: 0,
      occupiedRooms: full.rooms.length,
      rate: 100,
    });
  });
});

describe("demand", () => {
  it("splits this month's requests and reports an approval rate", () => {
    const summary = demand(
      [
        booking(),
        booking(),
        booking({ status: "rejected" }),
        booking({ status: "pending" }),
      ],
      month,
    );

    expect(summary).toMatchObject({
      total: 4,
      approved: 2,
      rejected: 1,
      pending: 1,
    });
    // Pending requests are undecided, so they do not drag the rate down.
    expect(summary.approvalRate).toBe(67);
  });

  it("has no approval rate before anything is decided", () => {
    expect(demand([booking({ status: "pending" })], month).approvalRate).toBeNull();
  });
});
