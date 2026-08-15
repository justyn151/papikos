import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultFilters, filterListings } from "@/features/home/home-utils";
import type { Amenity } from "@/features/home/types";
import { listings } from "@/features/listings/mock-listings";

import { SearchPage } from "./search-page";

describe("Papikos search page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/kos");
    document.documentElement.dataset.theme = "light";
  });

  it("renders results filtered from the initial URL-derived filters", () => {
    render(<SearchPage initialFilters={{ ...defaultFilters, query: "Bandung" }} />);

    expect(screen.getByText("Kos Asri Dago")).toBeInTheDocument();
    expect(screen.getByText("Bumi Pasteur Residence")).toBeInTheDocument();
    expect(screen.queryByText("Nara House Kemang")).not.toBeInTheDocument();
  });

  it("updates the grid and the URL when a room-type chip is selected", async () => {
    render(<SearchPage initialFilters={defaultFilters} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Putri" }),
    );

    expect(screen.queryByText("Nara House Kemang")).not.toBeInTheDocument();
    expect(screen.getByText("Kos Asri Dago")).toBeInTheDocument();
    // The address bar is synced on a short debounce, so results update first.
    await waitFor(() =>
      expect(window.location.search).toContain("type=putri"),
    );
  });

  it("combines location, type, price range, and amenities filters", async () => {
    render(<SearchPage initialFilters={defaultFilters} />);

    fireEvent.change(screen.getByLabelText("Harga minimum"), {
      target: { value: "1500000" },
    });
    fireEvent.change(screen.getByLabelText("Harga maksimum"), {
      target: { value: "2000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Laundry" }));

    const expected = filterListings(listings, {
      ...defaultFilters,
      minPrice: 1500000,
      maxPrice: 2000000,
      amenities: ["laundry"],
    });

    expect(screen.getByText(`${expected.length} hasil`)).toBeInTheDocument();
    for (const listing of expected) {
      expect(screen.getByText(listing.name)).toBeInTheDocument();
    }
    await waitFor(() => {
      expect(window.location.search).toContain("min=1500000");
      expect(window.location.search).toContain("max=2000000");
      expect(window.location.search).toContain("amenities=laundry");
    });
  });

  it("coalesces history writes while a price slider is dragged", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(<SearchPage initialFilters={defaultFilters} />);

    const maxSlider = screen.getByLabelText("Harga maksimum");
    // A real drag emits an input event per pixel; writing history on each one
    // trips browser throttling and re-prefetches every result link.
    for (let value = 2950000; value >= 2000000; value -= 50000) {
      fireEvent.change(maxSlider, { target: { value: String(value) } });
    }

    expect(replaceState).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(window.location.search).toContain("max=2000000"),
    );
    expect(replaceState).toHaveBeenCalledTimes(1);

    replaceState.mockRestore();
  });

  it("requires every selected amenity to be present (AND semantics)", () => {
    render(<SearchPage initialFilters={defaultFilters} />);

    fireEvent.click(screen.getByRole("button", { name: "Dapur" }));
    fireEvent.click(screen.getByRole("button", { name: "Laundry" }));

    const expected = filterListings(listings, {
      ...defaultFilters,
      amenities: ["kitchen", "laundry"],
    });

    expect(screen.getAllByText(/hasil$/)[0].textContent).toContain(
      String(expected.length),
    );
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(listings.length);
  });

  it("reflects normalizeSearchParams-derived filters in the panel and grid", () => {
    render(
      <SearchPage
        initialFilters={{
          ...defaultFilters,
          query: "Jakarta",
          type: "campur",
          minPrice: 1000000,
          maxPrice: 3000000,
          amenities: ["wifi"],
        }}
      />,
    );

    expect(screen.getByDisplayValue("1000000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3000000")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Campur" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Wi-Fi" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Papikos Senja Setiabudi")).toBeInTheDocument();
  });

  it("filters to listings with free rooms via the availability toggle", async () => {
    render(<SearchPage initialFilters={defaultFilters} />);

    const fullyBooked = listings.find((listing) => listing.availableRooms === 0);
    expect(fullyBooked).toBeDefined();
    expect(screen.getByText(fullyBooked!.name)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Masih ada kamar kosong" }),
    );

    expect(screen.queryByText(fullyBooked!.name)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(window.location.search).toContain("available=1"),
    );
  });

  it("filters to verified listings via the verified toggle", async () => {
    render(<SearchPage initialFilters={defaultFilters} />);

    const unverified = listings.find((listing) => !listing.verified);
    expect(unverified).toBeDefined();
    expect(screen.getByText(unverified!.name)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Hanya kos terverifikasi" }),
    );

    expect(screen.queryByText(unverified!.name)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(window.location.search).toContain("verified=1"),
    );
  });

  it("shows a match count on each option and disables dead-end options", () => {
    const base = {
      ...defaultFilters,
      amenities: ["privateBathroom", "motorParking"] as Amenity[],
    };
    render(<SearchPage initialFilters={base} />);

    // Nothing in the sample data pairs those two with laundry, so the chip has
    // to be surfaced as unselectable rather than silently emptying the results.
    const laundryCount = filterListings(listings, {
      ...base,
      amenities: [...base.amenities, "laundry"],
    }).length;
    expect(laundryCount).toBe(0);

    const laundryChip = screen.getByRole("button", { name: "Laundry" });
    expect(laundryChip).toBeDisabled();
    expect(laundryChip).toHaveTextContent("0");

    const wifiChip = screen.getByRole("button", { name: "Wi-Fi" });
    expect(wifiChip).toBeEnabled();
    expect(wifiChip).toHaveTextContent(
      String(
        filterListings(listings, {
          ...base,
          amenities: [...base.amenities, "wifi"],
        }).length,
      ),
    );
  });

  it("shows an empty state and resets via the clear-filters control", async () => {
    render(
      <SearchPage
        initialFilters={{ ...defaultFilters, query: "Atlantis" }}
      />,
    );

    expect(screen.getByText("Belum ada kos yang cocok")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Atur ulang pencarian" }));

    expect(screen.getByText("Papikos Senja Setiabudi")).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("persists favorites locally", async () => {
    render(<SearchPage initialFilters={defaultFilters} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Simpan ke favorit" })[0]);

    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.favorites")).toContain(
        "senja-setiabudi",
      ),
    );
  });

  it("updates the query in place from the header search without navigating away", () => {
    const assign = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign },
    });

    render(<SearchPage initialFilters={defaultFilters} />);

    fireEvent.change(screen.getByLabelText("Lokasi"), {
      target: { value: "Surabaya" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cari kos" }));

    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByText("Ruang Teduh Keputih")).toBeInTheDocument();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });
});
