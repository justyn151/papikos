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
    document.documentElement.dataset.theme = "light";
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
    expect(screen.queryByText("Kamar utama · 1/5")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pilih kamar" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Kamar tersedia").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1 kamar tersedia").length).toBeGreaterThan(0);
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
    fireEvent.change(within(dialog).getByLabelText("Pilihan kamar"), {
      target: { value: "senja-setiabudi-plus" },
    });
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
        '"roomId":"senja-setiabudi-plus"',
      ),
    );
  });

  it("animates the booking dialog out before restoring trigger focus", async () => {
    renderPage();
    const trigger = screen.getAllByRole("button", { name: "Ajukan sewa" })[0];
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", {
      name: "Ajukan permintaan sewa",
    });
    expect(dialog).toHaveAttribute("data-dialog-state", "open");

    fireEvent.click(within(dialog).getByRole("button", { name: "Tutup" }));

    expect(dialog).toHaveAttribute("data-dialog-state", "closing");
    expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("stores a structured question without publishing it in the Q&A list", async () => {
    const { unmount } = renderPage();
    const submittedText = "Apakah saya boleh membawa kursi kerja sendiri?";
    fireEvent.change(screen.getByLabelText("Pertanyaanmu"), {
      target: { value: submittedText },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kirim pertanyaan" }));

    expect(
      await screen.findByText("Pertanyaan tersimpan untuk pemilik (prototipe)."),
    ).toBeVisible();
    expect(screen.queryByText(submittedText)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(window.localStorage.getItem("papikos.listingQuestions")).toContain(
        '"status":"pending"',
      ),
    );

    unmount();
    renderPage();
    expect(screen.queryByText(submittedText)).not.toBeInTheDocument();
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
