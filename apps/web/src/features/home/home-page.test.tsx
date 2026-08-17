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

    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Bandung" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Find a kos" }));

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

  it("keeps the header search focused on renter location search and the hero as a plain CTA", () => {
    render(<HomePage />);

    const header = screen.getByRole("banner");
    expect(within(header).getByLabelText("Papikos")).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/masuk",
    );
    expect(within(header).queryByRole("navigation")).not.toBeInTheDocument();

    expect(screen.getAllByLabelText("Location")).toHaveLength(1);
    const heroCta = screen.getByRole("link", { name: "Start searching" });
    expect(heroCta).toHaveAttribute("href", "/kos");
  });

  it("links popular locations and the explore-all CTA to the search page", () => {
    render(<HomePage />);

    const popularLocations = screen.getByLabelText("Popular locations");
    expect(
      within(popularLocations).getByRole("link", { name: "Bandung" }),
    ).toHaveAttribute("href", "/kos?q=Bandung");
    expect(
      within(popularLocations).getByRole("link", { name: /^All$/ }),
    ).toHaveAttribute("href", "/kos");

    expect(
      screen.getByRole("link", { name: "See all kos" }),
    ).toHaveAttribute("href", "/kos");
  });

  it("keeps reveal content visible without IntersectionObserver", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Kos worth a closer look" }),
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

  it("completes the preference survey and exposes match reasons", async () => {
    render(<HomePage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Try the preference survey" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Tell us about your ideal kos" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show my matches" }));

    expect(
      await screen.findByText("Recommendations from your preferences"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/match$/).length).toBeGreaterThanOrEqual(3);
  });
});
