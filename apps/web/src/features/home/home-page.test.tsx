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

    const header = screen.getByRole("banner");
    fireEvent.change(within(header).getByLabelText("Location"), {
      target: { value: "Bandung" },
    });
    fireEvent.click(within(header).getByRole("button", { name: "Find a kos" }));

    expect(assign).toHaveBeenCalledWith("/kos?q=Bandung");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("renders exactly 8 static preview cards with no room-type filter controls", () => {
    render(<HomePage />);

    expect(document.querySelectorAll(".listing-card")).toHaveLength(8);
    expect(screen.queryByLabelText("Kos type")).not.toBeInTheDocument();
  });

  it("keeps the header to sign-in and search, with no navigation menu", () => {
    render(<HomePage />);

    const header = screen.getByRole("banner");
    expect(within(header).getByLabelText("Papikos")).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/masuk",
    );
    expect(within(header).queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("searches from the hero and shortcuts to a city", () => {
    const assign = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign },
    });

    render(<HomePage />);

    // The hero field is the page's one job; the header carries the same search
    // for every page after this one.
    const main = screen.getByRole("main");
    fireEvent.change(within(main).getByLabelText("Location"), {
      target: { value: "Yogyakarta" },
    });
    fireEvent.click(within(main).getByRole("button", { name: "Find a kos" }));
    expect(assign).toHaveBeenCalledWith("/kos?q=Yogyakarta");

    expect(
      within(main).getByRole("link", { name: "Bandung" }),
    ).toHaveAttribute("href", "/kos?q=Bandung");
    expect(
      screen.getByRole("link", { name: "See all kos" }),
    ).toHaveAttribute("href", "/kos");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("keeps reveal content visible without IntersectionObserver", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Kos available now" }),
    ).toBeVisible();
    expect(
      document.querySelectorAll('[data-reveal="static"]').length,
    ).toBeGreaterThan(0);
  });

  it("switches all primary copy to Indonesian and persists the locale", async () => {
    render(<HomePage />);

    fireEvent.click(screen.getAllByRole("button", { name: "ID" })[0]);

    expect(
      await screen.findByRole("heading", {
        name: /Temukan kos yang pas/i,
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.locale")).toBe('"id"'),
    );
  });

  it("offers no theme switch, and stays light", () => {
    render(<HomePage />);

    // Dark mode is commented out in site-header.tsx; see preferences.tsx.
    expect(
      screen.queryByRole("button", { name: /mode|dark|light/i }),
    ).not.toBeInTheDocument();
    expect(document.documentElement).not.toHaveAttribute("data-theme", "dark");
  });

/* The dark-mode control this replaced, kept for when it comes back:

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

*/

  it("persists favorites locally", async () => {
    render(<HomePage />);

    fireEvent.click(screen.getAllByRole("button", { name: "Save to favorites" })[0]);

    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.favorites")).toContain(
        "senja-setiabudi",
      ),
    );
  });

});
