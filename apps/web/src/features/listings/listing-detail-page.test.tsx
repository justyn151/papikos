import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { getRelatedListings, listingDetails } from "./mock-listings";
import { ListingDetailPage } from "./listing-detail-page";

const listing = listingDetails[0];

describe("kos detail page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", `/kos/${listing.id}`);
    delete document.documentElement.dataset.papikosReady;
  });

  function renderPage() {
    return render(
      <ListingDetailPage
        listing={listing}
        related={getRelatedListings(listing)}
        returnTo="/?q=Jakarta"
      />,
    );
  }

  it("shows transparent decision information and a preserved return link", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: listing.name }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pilihan kamar" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Rincian biaya" })).toBeVisible();
    expect(screen.getByText("Tidak ada deposit")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kembali ke hasil" })).toHaveAttribute(
      "href",
      "/?q=Jakarta",
    );
  });

  it("shares favorite state with the homepage storage key", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Simpan ke favorit" }),
    );

    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.favorites")).toContain(
        listing.id,
      ),
    );
  });

  it("submits and persists a pending rental request without payment", async () => {
    renderPage();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Ajukan sewa" })[0],
    );

    const dialog = screen.getByRole("dialog", {
      name: "Ajukan permintaan sewa",
    });
    expect(within(dialog).getByText(/tidak ada pembayaran/i)).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Kirim permintaan" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Permintaan sewa terkirim",
      }),
    ).toBeVisible();
    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.bookingRequests")).toContain(
        '"status":"pending"',
      ),
    );
  });

  it("stores a structured listing question as pending", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Pertanyaanmu"), {
      target: { value: "Apakah saya boleh membawa kursi kerja sendiri?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kirim pertanyaan" }));

    expect(
      await screen.findByText("Apakah saya boleh membawa kursi kerja sendiri?"),
    ).toBeVisible();
    expect(screen.getByText("Menunggu jawaban")).toBeVisible();
    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.listingQuestions")).toContain(
        '"status":"pending"',
      ),
    );
  });

  it("switches the detail experience to English", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(
      await screen.findByRole("heading", { name: "Room options" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Request to rent" }),
    ).toBeVisible();
  });
});
