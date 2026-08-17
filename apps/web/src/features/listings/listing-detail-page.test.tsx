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
      />,
    );
  }

  it("shows transparent decision information and a preserved return link", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: listing.name }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Room options" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Cost breakdown" })).toBeVisible();
    expect(screen.getByText("No deposit required")).toBeInTheDocument();
    expect(screen.queryByText("Rooms utama · 1/5")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pilih kamar" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Rooms available").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1 rooms available").length).toBeGreaterThan(0);
    // There is no in-page back link: the page is reached from the homepage,
    // search, favorites, and both consoles, and browser back is the only
    // control that returns to the right one of those.
    expect(
      screen.queryByRole("link", { name: /Kembali ke results/i }),
    ).not.toBeInTheDocument();
  });

  it("shares favorite state with the homepage storage key", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Save to favorites" }),
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
      screen.getAllByRole("button", { name: "Request to rent" })[0],
    );

    const dialog = screen.getByRole("dialog", {
      name: "Submit a rental request",
    });
    expect(within(dialog).getByText(/no payment/i)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Room choice"), {
      target: { value: "senja-setiabudi-plus" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Submit request" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Rental request submitted",
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
    const trigger = screen.getAllByRole("button", { name: "Request to rent" })[0];
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", {
      name: "Submit a rental request",
    });
    expect(dialog).toHaveAttribute("data-dialog-state", "open");

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(dialog).toHaveAttribute("data-dialog-state", "closing");
    expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("stores a structured question without publishing it in the Q&A list", async () => {
    const { unmount } = renderPage();
    const submittedText = "Apakah saya boleh membawa kursi kerja sendiri?";
    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: submittedText },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit question" }));

    expect(
      await screen.findByText("Question saved for the owner (prototype)."),
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

  it("switches the detail experience to Indonesian", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "ID" }));

    expect(
      await screen.findByRole("heading", { name: "Pilihan kamar" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Ajukan sewa" }),
    ).toBeVisible();
  });

  it("explains a cost and states that payment happens outside Papikos", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: /^Electricity — See how this charge works$/ }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Cost explanation",
    });
    expect(
      within(dialog).getByText(/billed separately from your room's meter/),
    ).toBeInTheDocument();
    // AGENTS.md rules out payment processing, so the dialog must say so.
    expect(
      within(dialog).getByText(/does not process payments/),
    ).toBeInTheDocument();
  });

  it("closes the cost explanation again", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: /^Deposit — See how this charge works$/ }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Cost explanation",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Cost explanation" }),
      ).not.toBeInTheDocument(),
    );
  });
});
