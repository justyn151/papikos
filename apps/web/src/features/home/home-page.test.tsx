import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { defaultFilters } from "./home-utils";
import { HomePage } from "./home-page";

describe("Papikos homepage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("filters listings on the page and syncs the URL", async () => {
    render(<HomePage initialFilters={defaultFilters} />);

    fireEvent.change(screen.getByLabelText("Lokasi"), {
      target: { value: "Bandung" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cari kos" }));

    expect(await screen.findByText("Kos Asri Dago")).toBeInTheDocument();
    expect(screen.getByText("Bumi Pasteur Residence")).toBeInTheDocument();
    expect(screen.queryByText("Nara House Kemang")).not.toBeInTheDocument();
    expect(window.location.search).toBe("?q=Bandung");
  });

  it("keeps the header and hero focused on renter location search", () => {
    render(<HomePage initialFilters={defaultFilters} />);

    const header = screen.getByRole("banner");
    expect(within(header).getByLabelText("Papikos")).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "Masuk" })).toBeInTheDocument();
    expect(within(header).queryByRole("navigation")).not.toBeInTheDocument();
    expect(
      within(header).queryByRole("button", { name: "Daftarkan kos" }),
    ).not.toBeInTheDocument();

    const searchForm = screen
      .getByRole("button", { name: "Cari kos" })
      .closest("form");
    expect(searchForm).not.toBeNull();
    expect(within(searchForm!).getAllByRole("textbox")).toHaveLength(1);
    expect(within(searchForm!).queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("4 kota demo")).not.toBeInTheDocument();
  });

  it("filters with popular locations and restores all locations", async () => {
    render(<HomePage initialFilters={defaultFilters} />);

    fireEvent.click(screen.getByRole("button", { name: "Bandung" }));
    expect(await screen.findByText("Kos Asri Dago")).toBeInTheDocument();
    expect(window.location.search).toBe("?q=Bandung");

    fireEvent.click(screen.getByRole("button", { name: /^Semua$/ }));
    expect(await screen.findByText("Nara House Kemang")).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("switches all primary copy to English and persists the locale", async () => {
    render(<HomePage initialFilters={defaultFilters} />);

    fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);

    expect(
      screen.getByRole("heading", { name: /Find a kos that fits your life/i }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.locale")).toBe('"en"'),
    );
  });

  it("persists favorites locally", async () => {
    render(<HomePage initialFilters={defaultFilters} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Simpan ke favorit" })[0]);

    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.favorites")).toContain(
        "senja-setiabudi",
      ),
    );
  });

  it("completes the preference survey and exposes match reasons", async () => {
    render(<HomePage initialFilters={defaultFilters} />);

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
