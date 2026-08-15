import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { getListingDetail } from "@/features/listings/mock-listings";
import {
  AUDIT_STORAGE_KEY,
  OVERRIDES_STORAGE_KEY,
} from "@/features/shared/storage-keys";

import { OwnerEditPage } from "./owner-edit-page";

const listing = getListingDetail("senja-setiabudi")!;

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.dataset.theme = "light";
});

function storedOverride() {
  return JSON.parse(window.localStorage.getItem(OVERRIDES_STORAGE_KEY) ?? "[]");
}

describe("owner listing editor", () => {
  it("prefills the form from the listing", async () => {
    render(<OwnerEditPage listing={listing} />);

    expect(await screen.findByLabelText("Nama kos")).toHaveValue(listing.name);
    expect(screen.getByLabelText("Harga bulanan")).toHaveValue(listing.price);
  });

  it("saves an edit and records who made it", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Nama kos"), {
      target: { value: "Kos Senja Baru" },
    });
    fireEvent.change(screen.getByLabelText("Harga bulanan"), {
      target: { value: "1900000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));

    await waitFor(() => {
      expect(storedOverride()[0]).toMatchObject({
        listingId: "senja-setiabudi",
        name: "Kos Senja Baru",
        price: 1900000,
      });
    });

    const log = JSON.parse(
      window.localStorage.getItem(AUDIT_STORAGE_KEY) ?? "[]",
    );
    expect(log[0]).toMatchObject({ actor: "owner", action: "listing.edited" });
  });

  it("rejects a promo price that is not actually cheaper", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Harga promo"), {
      target: { value: String(listing.price) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));

    // Storing it would render a meaningless "-0%" badge.
    expect(
      screen.getByText("Harga promo harus lebih murah dari harga normal."),
    ).toBeInTheDocument();
    expect(storedOverride()).toEqual([]);
  });

  it("stores a valid discount", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Harga promo"), {
      target: { value: "1800000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));

    await waitFor(() =>
      expect(storedOverride()[0]).toMatchObject({ promoPrice: 1800000 }),
    );
  });

  it("restores the seeded data on reset", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Nama kos"), {
      target: { value: "Sementara" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));
    await waitFor(() => expect(storedOverride()).toHaveLength(1));

    fireEvent.click(
      screen.getByRole("button", { name: "Kembalikan ke data awal" }),
    );

    // Reset deletes the override so the seed shows through again.
    await waitFor(() => expect(storedOverride()).toEqual([]));
    expect(screen.getByLabelText("Nama kos")).toHaveValue(listing.name);
  });

  it("edits room availability", async () => {
    render(<OwnerEditPage listing={listing} />);

    const roomInputs = await screen.findAllByLabelText("Kamar kosong");
    fireEvent.change(roomInputs[0], { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));

    await waitFor(() =>
      expect(storedOverride()[0].rooms[0].availableRooms).toBe(0),
    );
  });
});
