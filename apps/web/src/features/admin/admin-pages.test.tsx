import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { defaultFilters } from "@/features/home/home-utils";
import { SearchPage } from "@/features/search/search-page";
import {
  AUDIT_STORAGE_KEY,
  MODERATION_STORAGE_KEY,
  REPORTS_STORAGE_KEY,
} from "@/features/shared/storage-keys";

import { AdminAuditPage } from "./admin-audit-page";
import { AdminListingsPage } from "./admin-listings-page";
import { AdminOverviewPage } from "./admin-overview-page";
import { AdminReportsPage } from "./admin-reports-page";
import { AdminVerificationPage } from "./admin-verification-page";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/kos");
  document.documentElement.dataset.theme = "light";
});

function seedReport(status = "submitted") {
  window.localStorage.setItem(
    REPORTS_STORAGE_KEY,
    JSON.stringify([
      {
        id: "report-1",
        listingId: "senja-setiabudi",
        reason: "price",
        details: "Price di iklan berbeda dengan aslinya.",
        status,
        createdAt: "2026-08-01T00:00:00.000Z",
      },
    ]),
  );
}

function suspend(listingId: string) {
  window.localStorage.setItem(
    MODERATION_STORAGE_KEY,
    JSON.stringify([
      {
        listingId,
        published: true,
        suspended: true,
        verifiedOverride: null,
        updatedAt: "2026-08-01T00:00:00.000Z",
      },
    ]),
  );
}

describe("admin listings", () => {
  it("suspends a listing and records the action", async () => {
    render(<AdminListingsPage />);

    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Suspend" }))[0],
    );

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(MODERATION_STORAGE_KEY) ?? "[]",
      );
      expect(stored[0].suspended).toBe(true);
    });

    const log = JSON.parse(
      window.localStorage.getItem(AUDIT_STORAGE_KEY) ?? "[]",
    );
    expect(log[0]).toMatchObject({
      actor: "admin",
      action: "listing.suspended",
    });
  });
});

describe("suspension reaches renter search", () => {
  it("removes a suspended listing from results and facet counts", async () => {
    suspend("senja-setiabudi");
    render(<SearchPage initialFilters={defaultFilters} />);

    // The whole point of moderation: renters must not see it at all.
    await waitFor(() =>
      expect(
        screen.queryByText("Papikos Senja Setiabudi"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Kos Asri Dago")).toBeInTheDocument();
  });
});

describe("admin verification", () => {
  it("overrides the seeded verification flag", async () => {
    render(<AdminVerificationPage />);

    // Ruang Teduh Keputih ships unverified in the sample data.
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Verify" }))[0],
    );

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(MODERATION_STORAGE_KEY) ?? "[]",
      );
      expect(stored[0].verifiedOverride).toBe(true);
    });
  });
});

describe("admin reports", () => {
  it("shows an empty state when nothing was reported", async () => {
    render(<AdminReportsPage />);

    expect(await screen.findByText("No reports yet.")).toBeInTheDocument();
  });

  it("moves a report through review to resolved", async () => {
    seedReport();
    render(<AdminReportsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Mark reviewing" }));
    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(REPORTS_STORAGE_KEY) ?? "[]",
      );
      expect(stored[0].status).toBe("reviewing");
    });

    fireEvent.click(screen.getByRole("button", { name: "Resolve" }));
    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(REPORTS_STORAGE_KEY) ?? "[]",
      );
      expect(stored[0].status).toBe("resolved");
      expect(stored[0].resolvedAt).toBeTruthy();
    });
  });
});

describe("admin overview and audit", () => {
  it("summarises the marketplace", async () => {
    render(<AdminOverviewPage />);

    expect(await screen.findByText("Total kos")).toBeInTheDocument();
    expect(screen.getByText("Live kos")).toBeInTheDocument();
    expect(screen.getByText("City spread")).toBeInTheDocument();
  });

  it("lists recorded privileged changes", async () => {
    window.localStorage.setItem(
      AUDIT_STORAGE_KEY,
      JSON.stringify([
        {
          id: "audit-1",
          actor: "admin",
          action: "listing.suspended",
          targetId: "senja-setiabudi",
          at: "2026-08-02T10:00:00.000Z",
        },
      ]),
    );
    render(<AdminAuditPage />);

    expect(await screen.findByText("listing.suspended")).toBeInTheDocument();
    expect(screen.getByText("senja-setiabudi")).toBeInTheDocument();
  });

  it("shows an empty audit trail before anything happens", async () => {
    render(<AdminAuditPage />);

    expect(
      await screen.findByText("No recorded activity yet."),
    ).toBeInTheDocument();
  });
});
