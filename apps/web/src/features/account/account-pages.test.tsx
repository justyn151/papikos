import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { BookingRequest } from "@/features/listings/types";
import {
  BOOKINGS_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
} from "@/features/shared/storage-keys";

import { FavoritesPage } from "./favorites-page";
import { RequestsPage } from "./requests-page";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.dataset.theme = "light";
});

function seedBooking(overrides: Partial<BookingRequest> = {}) {
  const booking: BookingRequest = {
    id: "booking-1",
    listingId: "senja-setiabudi",
    roomId: "senja-setiabudi-standard",
    moveInDate: "2026-09-01",
    durationMonths: 3,
    note: "",
    status: "pending",
    statusHistory: [
      { status: "pending", at: "2026-08-01T00:00:00.000Z", by: "renter" },
    ],
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
  window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify([booking]));
  return booking;
}

describe("favorites page", () => {
  it("shows an empty state when nothing is saved", async () => {
    render(<FavoritesPage />);

    expect(
      await screen.findByText("No saved kos yet"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find a kos" })).toHaveAttribute(
      "href",
      "/kos",
    );
  });

  it("lists only the saved listings", async () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(["asri-dago", "oma-pogung"]),
    );
    render(<FavoritesPage />);

    expect(await screen.findByText("Kos Asri Dago")).toBeInTheDocument();
    expect(screen.getByText("Omah Pogung Ceria")).toBeInTheDocument();
    expect(screen.queryByText("Nara House Kemang")).not.toBeInTheDocument();
  });

  it("removes a listing when its heart is pressed", async () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(["asri-dago"]),
    );
    render(<FavoritesPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Remove from favorites" }),
    );

    expect(await screen.findByText("No saved kos yet")).toBeInTheDocument();
    await waitFor(() =>
      expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe("[]"),
    );
  });
});

describe("renter requests page", () => {
  it("shows an empty state when nothing has been submitted", async () => {
    render(<RequestsPage />);

    expect(
      await screen.findByText("No rental requests yet"),
    ).toBeInTheDocument();
  });

  it("renders a stored request with its listing and status", async () => {
    seedBooking();
    render(<RequestsPage />);

    expect(
      await screen.findByText("Papikos Senja Setiabudi"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
  });

  it("cancels a pending request and records it in the history", async () => {
    seedBooking();
    render(<RequestsPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Cancel request" }),
    );

    // The badge shows both as the headline status and in the history list.
    expect((await screen.findAllByText("Cancelled")).length).toBeGreaterThan(1);
    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(BOOKINGS_STORAGE_KEY) ?? "[]",
      );
      expect(stored[0].status).toBe("cancelled");
      expect(stored[0].statusHistory).toHaveLength(2);
    });
  });

  it("offers no cancel control once a request is resolved", async () => {
    seedBooking({
      status: "approved",
      statusHistory: [
        { status: "pending", at: "2026-08-01T00:00:00.000Z", by: "renter" },
        { status: "approved", at: "2026-08-02T00:00:00.000Z", by: "owner" },
      ],
    });
    render(<RequestsPage />);

    expect((await screen.findAllByText("Approved")).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Cancel request" }),
    ).not.toBeInTheDocument();
  });

  it("migrates a legacy request that predates status history", async () => {
    // Written by an older build; must not crash the page.
    window.localStorage.setItem(
      BOOKINGS_STORAGE_KEY,
      JSON.stringify([
        {
          id: "legacy-1",
          listingId: "asri-dago",
          roomId: "asri-dago-standard",
          moveInDate: "2026-09-01",
          durationMonths: 2,
          note: "",
          status: "pending",
          createdAt: "2026-08-01T00:00:00.000Z",
        },
      ]),
    );
    render(<RequestsPage />);

    expect(await screen.findByText("Kos Asri Dago")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel request" }),
    ).toBeInTheDocument();
  });
});
