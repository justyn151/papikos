import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { getListingDetail } from "@/features/listings/mock-listings";
import {
  AUDIT_STORAGE_KEY,
  BOOKINGS_STORAGE_KEY,
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

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
}

describe("owner listing editor", () => {
  it("prefills the form from the listing", async () => {
    render(<OwnerEditPage listing={listing} />);

    expect(await screen.findByLabelText("Kos name")).toHaveValue(listing.name);
    expect(screen.getByLabelText("City")).toHaveValue(listing.city);
    expect(screen.getAllByLabelText("Room name")[0]).toHaveValue(
      listing.rooms[0].name.en,
    );
  });

  it("saves an edit and records who made it", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Kos name"), {
      target: { value: "Kos Senja Baru" },
    });
    save();

    await waitFor(() => {
      expect(storedOverride()[0]).toMatchObject({
        listingId: "senja-setiabudi",
        name: "Kos Senja Baru",
      });
    });

    const log = JSON.parse(
      window.localStorage.getItem(AUDIT_STORAGE_KEY) ?? "[]",
    );
    expect(log[0]).toMatchObject({ actor: "owner", action: "listing.edited" });
  });

  it("prices the kos from its cheapest room instead of a typed number", async () => {
    render(<OwnerEditPage listing={listing} />);

    const prices = await screen.findAllByLabelText("Price");
    fireEvent.change(prices[0], { target: { value: "1250000" } });
    fireEvent.change(prices[1], { target: { value: "3000000" } });
    save();

    await waitFor(() =>
      expect(storedOverride()[0]).toMatchObject({ price: 1250000 }),
    );
  });

  it("rejects a discount outside the sensible range", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Discount (%)"), {
      target: { value: "150" },
    });
    save();

    // A 150% discount would pay the renter to move in.
    expect(
      screen.getByText("The discount must be between 1% and 90%."),
    ).toBeInTheDocument();
    expect(storedOverride()).toEqual([]);
  });

  it("stores the percentage and the price it produces", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Discount (%)"), {
      target: { value: "10" },
    });
    save();

    await waitFor(() => {
      const stored = storedOverride()[0];
      expect(stored.discountPercent).toBe(10);
      expect(stored.promoPrice).toBe(Math.round((stored.price * 0.9) / 1000) * 1000);
    });
  });

  it("refuses to save a kos with no name", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Kos name"), {
      target: { value: "   " },
    });
    save();

    expect(
      screen.getByText("The kos name cannot be empty."),
    ).toBeInTheDocument();
    expect(storedOverride()).toEqual([]);
  });

  it("restores the seeded data on reset", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Kos name"), {
      target: { value: "Sementara" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(storedOverride()).toHaveLength(1));

    fireEvent.click(
      screen.getByRole("button", { name: "Restore original data" }),
    );

    // Reset deletes the override so the seed shows through again.
    await waitFor(() => expect(storedOverride()).toEqual([]));
    expect(screen.getByLabelText("Kos name")).toHaveValue(listing.name);
  });

  it("edits room availability", async () => {
    render(<OwnerEditPage listing={listing} />);

    const roomInputs = await screen.findAllByLabelText("Rooms free");
    fireEvent.change(roomInputs[0], { target: { value: "0" } });
    save();

    await waitFor(() =>
      expect(storedOverride()[0].rooms[0].availableRooms).toBe(0),
    );
  });
});

describe("loading an already-edited kos", () => {
  it("shows the saved edit rather than the seeded data", async () => {
    window.localStorage.setItem(
      OVERRIDES_STORAGE_KEY,
      JSON.stringify([
        {
          listingId: listing.id,
          name: "Kos Tersimpan",
          rooms: [
            {
              id: "room-saved",
              name: "Kamar Tersimpan",
              size: "3 × 3 m",
              price: 1_000_000,
              availableRooms: 1,
              bathroom: "private",
              furnishings: [],
            },
          ],
          updatedAt: "2026-08-10T00:00:00.000Z",
        },
      ]),
    );
    render(<OwnerEditPage listing={listing} />);

    // Browser storage is read after hydration. If the form kept its first
    // render, the owner would see the seeded kos and saving would overwrite
    // everything they had already changed.
    await waitFor(() =>
      expect(screen.getByLabelText("Kos name")).toHaveValue("Kos Tersimpan"),
    );
    expect(screen.getAllByLabelText("Room name")).toHaveLength(1);
    expect(screen.getByLabelText("Room name")).toHaveValue("Kamar Tersimpan");
  });
});

describe("adding and removing rooms", () => {
  it("adds a room the owner can fill in", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.click(await screen.findByRole("button", { name: "Add room" }));

    const names = screen.getAllByLabelText("Room name");
    expect(names).toHaveLength(listing.rooms.length + 1);

    fireEvent.change(names.at(-1)!, { target: { value: "Kamar Atas" } });
    fireEvent.change(screen.getAllByLabelText("Price").at(-1)!, {
      target: { value: "3000000" },
    });
    save();

    await waitFor(() => {
      const stored = storedOverride()[0];
      expect(stored.rooms).toHaveLength(listing.rooms.length + 1);
      expect(stored.rooms.at(-1)).toMatchObject({
        name: "Kamar Atas",
        price: 3000000,
      });
    });
  });

  it("removes a room and stops storing it", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.click(
      (
        await screen.findAllByRole("button", {
          name: `Remove room: ${listing.rooms[1].name.en}`,
        })
      )[0],
    );
    save();

    await waitFor(() => {
      const stored = storedOverride()[0];
      expect(stored.rooms).toHaveLength(listing.rooms.length - 1);
      expect(stored.rooms[0].id).toBe(listing.rooms[0].id);
    });
  });

  it("keeps the last room, because an empty kos cannot be rented", async () => {
    render(<OwnerEditPage listing={listing} />);

    for (const room of listing.rooms.slice(1)) {
      fireEvent.click(
        screen.getByRole("button", { name: `Remove room: ${room.name.en}` }),
      );
    }
    fireEvent.click(
      screen.getByRole("button", {
        name: `Remove room: ${listing.rooms[0].name.en}`,
      }),
    );

    expect(
      screen.getByText("A kos needs at least one room."),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("Room name")).toHaveLength(1);
  });

  it("refuses to remove a room a renter has a live request for", async () => {
    const booked = listing.rooms[1];
    window.localStorage.setItem(
      BOOKINGS_STORAGE_KEY,
      JSON.stringify([
        {
          id: "booking-1",
          listingId: listing.id,
          roomId: booked.id,
          moveInDate: "2026-09-01",
          durationMonths: 3,
          note: "",
          status: "approved",
          statusHistory: [
            { status: "pending", at: "2026-08-01T00:00:00.000Z", by: "renter" },
          ],
          createdAt: "2026-08-01T00:00:00.000Z",
        },
      ]),
    );
    render(<OwnerEditPage listing={listing} />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: `Remove room: ${booked.name.en}`,
      }),
    );

    // Deleting it would leave the request, the owner's inbox, and the earnings
    // report pointing at a room that no longer exists.
    expect(
      screen.getByText(
        "This room has a rental request still running, so it cannot be removed yet.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("Room name")).toHaveLength(
      listing.rooms.length,
    );
  });
});

describe("cost rows", () => {
  it("adds the owner's own cost row, with the reason behind it", async () => {
    render(<OwnerEditPage listing={listing} />);

    fireEvent.change(await screen.findByLabelText("Add cost"), {
      target: { value: "Iuran kebersihan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add cost" }));
    fireEvent.change(
      screen.getByLabelText("Explanation: Iuran kebersihan"),
      { target: { value: "Ditagih tiap awal months" } },
    );
    save();

    // Without the note an added charge reaches renters as a bare label: the
    // seeded explanations only cover the charges Papikos shipped.
    await waitFor(() =>
      expect(storedOverride()[0].customCosts).toEqual([
        expect.objectContaining({
          label: "Iuran kebersihan",
          included: false,
          note: "Ditagih tiap awal months",
        }),
      ]),
    );
  });

  it("tombstones a seeded cost the owner removed", async () => {
    const removed = listing.costs[1];
    render(<OwnerEditPage listing={listing} />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: `Remove cost: ${removed.label.en}`,
      }),
    );
    save();

    await waitFor(() =>
      expect(storedOverride()[0].costs).toContainEqual(
        expect.objectContaining({ id: removed.id, removed: true }),
      ),
    );
  });
});
