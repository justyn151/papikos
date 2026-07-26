import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
