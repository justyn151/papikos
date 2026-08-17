import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { getListingDetail } from "./mock-listings";
import { ListingGallery } from "./listing-gallery";

const listing = getListingDetail("senja-setiabudi")!;
const total = listing.gallery.length;

function renderGallery() {
  return render(<ListingGallery listing={listing} locale="en" />);
}

beforeEach(() => {
  document.documentElement.dataset.theme = "light";
});

describe("listing gallery", () => {
  it("shows one photo at a time, with a dot for each", () => {
    renderGallery();

    expect(screen.getByText(`1 of ${total}`)).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: /^Go to photo \d+$/ }),
    ).toHaveLength(total);
    expect(
      screen.getByRole("button", { name: "Go to photo 1" }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("steps forward and wraps at the end", () => {
    renderGallery();
    const next = screen.getByRole("button", { name: "Next photo" });

    fireEvent.click(next);
    expect(screen.getByText(`2 of ${total}`)).toBeVisible();

    for (let step = 1; step < total; step += 1) fireEvent.click(next);
    // Wrapping matters more here than on a list: the arrows are the only way
    // through the set, so a dead end would strand the last photo.
    expect(screen.getByText(`1 of ${total}`)).toBeVisible();
  });

  it("steps backwards from the first photo to the last", () => {
    renderGallery();

    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));

    expect(screen.getByText(`${total} of ${total}`)).toBeVisible();
  });

  it("jumps to the photo a dot names", () => {
    renderGallery();

    fireEvent.click(screen.getByRole("button", { name: "Go to photo 3" }));

    expect(screen.getByText(`3 of ${total}`)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Go to photo 3" }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("opens the photo in a dialog and keeps browsing there", () => {
    renderGallery();

    fireEvent.click(
      screen.getByRole("button", { name: "View this photo larger" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Photo gallery" });
    expect(within(dialog).getByText(`1 of ${total}`)).toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: "Next photo" }));
    expect(within(dialog).getByText(`2 of ${total}`)).toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(
      screen.queryByRole("dialog", { name: "Photo gallery" }),
    ).not.toBeInTheDocument();
    // The page keeps whatever the dialog was left on.
    expect(screen.getByText(`2 of ${total}`)).toBeVisible();
  });

  it("moves through the dialog with the arrow keys", () => {
    renderGallery();
    fireEvent.click(
      screen.getByRole("button", { name: "View this photo larger" }),
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    const dialog = screen.getByRole("dialog", { name: "Photo gallery" });
    expect(within(dialog).getByText(`2 of ${total}`)).toBeVisible();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(within(dialog).getByText(`1 of ${total}`)).toBeVisible();
  });
});
