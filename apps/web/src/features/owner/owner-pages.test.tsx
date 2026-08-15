import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type {
  BookingRequest,
  SubmittedQuestion,
} from "@/features/listings/types";
import {
  AUDIT_STORAGE_KEY,
  BOOKINGS_STORAGE_KEY,
  MODERATION_STORAGE_KEY,
  QUESTIONS_STORAGE_KEY,
} from "@/features/shared/storage-keys";

import { OwnerDashboardPage } from "./owner-dashboard-page";
import { OwnerListingsPage } from "./owner-listings-page";
import { OwnerQuestionsPage } from "./owner-questions-page";
import { OwnerRequestsPage } from "./owner-requests-page";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.dataset.theme = "light";
});

function seedBooking(overrides: Partial<BookingRequest> = {}) {
  window.localStorage.setItem(
    BOOKINGS_STORAGE_KEY,
    JSON.stringify([
      {
        id: "booking-1",
        listingId: "senja-setiabudi",
        roomId: "senja-setiabudi-standard",
        moveInDate: "2026-09-01",
        durationMonths: 3,
        note: "Boleh bawa meja sendiri?",
        status: "pending",
        statusHistory: [
          { status: "pending", at: "2026-08-01T00:00:00.000Z", by: "renter" },
        ],
        createdAt: "2026-08-01T00:00:00.000Z",
        ...overrides,
      },
    ]),
  );
}

function seedQuestion(overrides: Partial<SubmittedQuestion> = {}) {
  window.localStorage.setItem(
    QUESTIONS_STORAGE_KEY,
    JSON.stringify([
      {
        id: "q-1",
        listingId: "senja-setiabudi",
        question: "Apakah listrik sudah termasuk?",
        status: "pending",
        createdAt: "2026-08-01T00:00:00.000Z",
        ...overrides,
      },
    ]),
  );
}

describe("owner booking inbox", () => {
  it("approves a request, records history, and writes an audit entry", async () => {
    seedBooking();
    render(<OwnerRequestsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Setujui" }));

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(BOOKINGS_STORAGE_KEY) ?? "[]",
      );
      expect(stored[0].status).toBe("approved");
      expect(stored[0].statusHistory).toHaveLength(2);
      expect(stored[0].statusHistory[1].by).toBe("owner");
    });

    await waitFor(() => {
      const log = JSON.parse(
        window.localStorage.getItem(AUDIT_STORAGE_KEY) ?? "[]",
      );
      expect(log[0]).toMatchObject({
        actor: "owner",
        action: "booking.approved",
        targetId: "booking-1",
      });
    });
  });

  it("rejects a request", async () => {
    seedBooking();
    render(<OwnerRequestsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Tolak" }));

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(BOOKINGS_STORAGE_KEY) ?? "[]",
      );
      expect(stored[0].status).toBe("rejected");
    });
  });

  it("offers no decision controls once a request is resolved", async () => {
    seedBooking({
      status: "cancelled",
      statusHistory: [
        { status: "pending", at: "2026-08-01T00:00:00.000Z", by: "renter" },
        { status: "cancelled", at: "2026-08-02T00:00:00.000Z", by: "renter" },
      ],
    });
    render(<OwnerRequestsPage />);

    expect(await screen.findByText("Sudah diputuskan")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Setujui" }),
    ).not.toBeInTheDocument();
  });
});

describe("owner question inbox", () => {
  it("requires an answer before it can be sent", async () => {
    seedQuestion();
    render(<OwnerQuestionsPage />);

    expect(
      await screen.findByRole("button", { name: "Kirim jawaban" }),
    ).toBeDisabled();
  });

  it("stores an answer and marks the question answered", async () => {
    seedQuestion();
    render(<OwnerQuestionsPage />);

    fireEvent.change(await screen.findByLabelText("Jawabanmu"), {
      target: { value: "Listrik dihitung per meter kamar." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kirim jawaban" }));

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(QUESTIONS_STORAGE_KEY) ?? "[]",
      );
      expect(stored[0]).toMatchObject({
        status: "answered",
        answer: "Listrik dihitung per meter kamar.",
      });
    });
  });
});

describe("owner listings", () => {
  it("hides a listing from search and records who did it", async () => {
    render(<OwnerListingsPage />);

    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Sembunyikan" }))[0],
    );

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(MODERATION_STORAGE_KEY) ?? "[]",
      );
      expect(stored[0].published).toBe(false);
    });

    const log = JSON.parse(
      window.localStorage.getItem(AUDIT_STORAGE_KEY) ?? "[]",
    );
    expect(log[0]).toMatchObject({ actor: "owner", action: "listing.unpublished" });
  });

  it("does not let an owner republish a listing an admin suspended", async () => {
    window.localStorage.setItem(
      MODERATION_STORAGE_KEY,
      JSON.stringify([
        {
          listingId: "senja-setiabudi",
          published: false,
          suspended: true,
          verifiedOverride: null,
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      ]),
    );
    render(<OwnerListingsPage />);

    expect(
      await screen.findByText("Ditangguhkan admin"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Tayangkan" })[0]).toBeDisabled();
  });
});

describe("owner dashboard", () => {
  it("counts what needs attention", async () => {
    seedBooking();
    seedQuestion();
    render(<OwnerDashboardPage />);

    expect(await screen.findByText("Permintaan menunggu")).toBeInTheDocument();
    expect(screen.getByText("Pertanyaan belum dijawab")).toBeInTheDocument();
    // One pending booking and one unanswered question.
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
  });

  it("says everything is clear when there is nothing pending", async () => {
    render(<OwnerDashboardPage />);

    expect(
      await screen.findByText("Tidak ada yang perlu ditindak lanjuti."),
    ).toBeInTheDocument();
  });
});
