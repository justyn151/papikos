import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomePage } from "./home-page";

describe("Papikos homepage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
    document.documentElement.dataset.theme = "light";
  });

  it("navigates to the search page via the header search bar", () => {
    const assign = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign },
    });

    render(<HomePage />);

    fireEvent.change(screen.getByLabelText("Lokasi"), {
      target: { value: "Bandung" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cari kos" }));

    expect(assign).toHaveBeenCalledWith("/kos?q=Bandung");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("renders exactly 8 static preview cards with no room-type filter controls", () => {
    render(<HomePage />);

    expect(document.querySelectorAll(".listing-card")).toHaveLength(8);
    expect(screen.queryByLabelText("Tipe kos")).not.toBeInTheDocument();
  });

  it("keeps the header search focused on renter location search and the hero as a plain CTA", () => {
    render(<HomePage />);

    const header = screen.getByRole("banner");
    expect(within(header).getByLabelText("Papikos")).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Masuk" })).toHaveAttribute(
      "href",
      "/masuk",
    );
    expect(within(header).queryByRole("navigation")).not.toBeInTheDocument();

    expect(screen.getAllByLabelText("Lokasi")).toHaveLength(1);
    const heroCta = screen.getByRole("link", { name: "Mulai cari kos" });
    expect(heroCta).toHaveAttribute("href", "/kos");
  });

  it("links popular locations and the explore-all CTA to the search page", () => {
    render(<HomePage />);

    const popularLocations = screen.getByLabelText("Lokasi populer");
    expect(
      within(popularLocations).getByRole("link", { name: "Bandung" }),
    ).toHaveAttribute("href", "/kos?q=Bandung");
    expect(
      within(popularLocations).getByRole("link", { name: /^Semua$/ }),
    ).toHaveAttribute("href", "/kos");

    expect(
      screen.getByRole("link", { name: "Lihat semua kos" }),
    ).toHaveAttribute("href", "/kos");
  });

  it("keeps reveal content visible without IntersectionObserver", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Kos yang layak dilihat" }),
    ).toBeVisible();
    expect(
      document.querySelectorAll('[data-reveal="static"]').length,
    ).toBeGreaterThan(0);
  });

  it("switches all primary copy to English and persists the locale", async () => {
    render(<HomePage />);

    fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);

    expect(
      await screen.findByRole("heading", {
        name: /Find a kos that fits your life/i,
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.locale")).toBe('"en"'),
    );
  });

  it("exposes a persistent light and dark mode control", () => {
    render(<HomePage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Aktifkan mode gelap" }),
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("papikos.theme")).toBe('"dark"');
    expect(
      screen.getByRole("button", { name: "Aktifkan mode terang" }),
    ).toBeVisible();
  });

  it("persists favorites locally", async () => {
    render(<HomePage />);

    fireEvent.click(screen.getAllByRole("button", { name: "Simpan ke favorit" })[0]);

    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.favorites")).toContain(
        "senja-setiabudi",
      ),
    );
  });

  it("completes the preference survey and exposes match reasons", async () => {
    render(<HomePage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Coba survei preferensi" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Ceritakan kos idealmu" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tampilkan kecocokan" }));

    expect(
      await screen.findByText("Rekomendasi dari preferensimu"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/cocok$/).length).toBeGreaterThanOrEqual(3);
  });
});
