import { expect, test } from "@playwright/test";

import { openRequestDialog, waitForReady } from "./helpers";

async function switchRole(
  page: import("@playwright/test").Page,
  label: "Renter" | "Owner" | "Admin",
) {
  await page.getByRole("button", { name: label, exact: true }).click();
}

test("a rental request travels from renter to owner and back", async ({
  page,
}) => {
  // The whole premise of the prototype store: renter submissions are real
  // records the owner can act on, and the decision returns to the renter.
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);

  await openRequestDialog(page);
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(
    page.getByRole("heading", { name: "Rental request submitted" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  // Renter sees it as pending.
  await page.goto("/permintaan");
  await waitForReady(page);
  await expect(page.getByText("Papikos Senja Setiabudi")).toBeVisible();
  await expect(page.getByText("Pending").first()).toBeVisible();

  // Owner sees the same record and approves it.
  await switchRole(page, "Owner");
  await page.goto("/pemilik/permintaan");
  await waitForReady(page);
  await expect(page.getByText("Papikos Senja Setiabudi")).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Already decided")).toBeVisible();

  // The decision is visible to the renter, with both history entries kept.
  await switchRole(page, "Renter");
  await page.goto("/permintaan");
  await waitForReady(page);
  await expect(page.getByText("Approved").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel request" }),
  ).toHaveCount(0);

  await page.getByText("Status history").click();
  await expect(page.getByText("by owner")).toBeVisible();
});

test("an owner answer reaches the kos page", async ({ page }) => {
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);

  await page
    .getByLabel("Your question")
    .fill("Apakah ada jam malam untuk penghuni?");
  await page.getByRole("button", { name: "Submit question" }).click();
  await expect(
    page.getByText("Question saved for the owner (prototype)."),
  ).toBeVisible();

  // A pending question stays private between renter and owner.
  await page.reload();
  await waitForReady(page);
  await expect(
    page.getByText("Apakah ada jam malam untuk penghuni?"),
  ).toHaveCount(0);

  await page.goto("/pemilik/tanya-jawab");
  await waitForReady(page);
  await page.getByLabel("Your answer").fill("Tidak ada jam malam, akses 24 jam.");
  await page.getByRole("button", { name: "Send answer" }).click();

  // Once answered it becomes useful to everyone.
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await expect(
    page.getByText("Apakah ada jam malam untuk penghuni?"),
  ).toBeVisible();
  await expect(
    page.getByText("Tidak ada jam malam, akses 24 jam."),
  ).toBeVisible();
});

test("an admin suspension removes a kos from renter search and is audited", async ({
  page,
}) => {
  await page.goto("/admin/kos");
  await waitForReady(page);

  const row = page
    .locator("li")
    .filter({ hasText: "Papikos Senja Setiabudi" })
    .first();
  await row.getByRole("button", { name: "Suspend" }).click();
  await expect(row.getByText("Suspended")).toBeVisible();

  await page.goto("/kos");
  await waitForReady(page);
  await expect(page.getByText("Papikos Senja Setiabudi")).toHaveCount(0);
  await expect(page.getByText("Kos Asri Dago")).toBeVisible();

  await page.goto("/admin/audit");
  await waitForReady(page);
  await expect(page.getByText("listing.suspended")).toBeVisible();
  await expect(page.getByText("senja-setiabudi")).toBeVisible();
});

test("saved kos are listed on the favorites page", async ({ page }) => {
  await page.goto("/kos");
  await waitForReady(page);

  const firstCard = page.locator(".listing-card").first();
  const name = await firstCard.locator("h3").innerText();
  await firstCard.getByRole("button", { name: "Save to favorites" }).click();

  await page.getByRole("link", { name: "Saved kos" }).click();
  await expect(page).toHaveURL(/\/favorit$/);
  await expect(page.getByText(name)).toBeVisible();

  await page.getByRole("button", { name: "Remove from favorites" }).click();
  await expect(page.getByText("No saved kos yet")).toBeVisible();
});

test("a cost row explains itself and rules out in-app payment", async ({
  page,
}) => {
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);

  await page
    .getByRole("button", { name: "Electricity — See how this charge works" })
    .click();

  const dialog = page.getByRole("dialog", { name: "Cost explanation" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/room's meter/)).toBeVisible();
  await expect(dialog.getByText(/does not process payments/)).toBeVisible();
});

test("an owner edit reaches renter search, filtering, and the audit trail", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await page.getByLabel("Kos name").fill("Kos Senja Updated");
  // The headline price follows the cheapest room, and the discount is a
  // percentage, so both are set through what the owner actually decides.
  await page.getByLabel("Price", { exact: true }).first().fill("2000000");
  await page.getByLabel("Discount (%)").fill("15");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();

  await page.goto("/kos?q=Senja");
  await waitForReady(page);
  const card = page.locator(".listing-card").first();
  await expect(card).toContainText("Kos Senja Updated");
  await expect(card).toContainText("-15%");
  await expect(card).toContainText("IDR 1,700,000");

  // The discounted price, not the list price, is what a budget filter matches.
  await page.goto("/kos?max=1800000");
  await waitForReady(page);
  await expect(page.getByText("Kos Senja Updated")).toBeVisible();

  await page.goto("/admin/audit");
  await waitForReady(page);
  await expect(page.getByText("listing.edited")).toBeVisible();
});

test("resetting an edit restores the seeded listing", async ({ page }) => {
  await page.goto("/pemilik/kos/asri-dago");
  await waitForReady(page);

  await page.getByLabel("Kos name").fill("Nama Sementara");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();

  await page.getByRole("button", { name: "Restore original data" }).click();
  await expect(page.getByLabel("Kos name")).toHaveValue("Kos Asri Dago");

  await page.goto("/kos?q=Dago");
  await waitForReady(page);
  await expect(page.getByText("Kos Asri Dago")).toBeVisible();
});

test("an approved request shows up as owner earnings net of commission", async ({
  page,
}) => {
  await page.goto("/pemilik");
  await waitForReady(page);
  await expect(page.getByText("from 0 approved requests")).toBeVisible();

  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await openRequestDialog(page);
  await page.getByRole("button", { name: "Submit request" }).click();
  await page.getByRole("button", { name: "Close" }).click();

  await page.goto("/pemilik/permintaan");
  await waitForReady(page);
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Already decided")).toBeVisible();

  await page.goto("/pemilik");
  await waitForReady(page);
  await expect(page.getByText("from 1 approved requests")).toBeVisible();

  // Gross, the platform's cut, and what actually reaches the owner are all
  // shown; the commission is what makes the last two differ.
  const earnings = page
    .locator("section")
    .filter({ hasText: "Earnings this month" })
    .first();
  await expect(earnings.getByText("Gross earnings")).toBeVisible();
  await expect(earnings.getByText("Papikos commission")).toBeVisible();
  await expect(earnings.getByText("Owner receives")).toBeVisible();
  await expect(earnings.getByText(/Papikos never receives/)).toBeVisible();
  await expect(earnings.getByText("IDR 0")).toHaveCount(0);
});

test("an uploaded photo becomes the kos cover and survives a reload", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await expect(page.getByText("No photos yet")).toBeVisible();
  await page.getByLabel("Add photos").setInputFiles({
    name: "kamar.png",
    mimeType: "image/png",
    // A 1x1 PNG: enough for the browser to decode, downscale, and re-encode.
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(page.getByText("1 of 20 photos")).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();

  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await expect(page.getByRole("img", { name: "Owner photo 1" })).toBeVisible();

  await page.reload();
  await waitForReady(page);
  await expect(page.getByRole("img", { name: "Owner photo 1" })).toBeVisible();
});

test("a custom house rule reaches renters alongside the standard ones", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await page.getByLabel("Additional rules").fill("Jam tamu maksimal 21.00");
  await page.getByRole("button", { name: "Add rule" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();

  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  const rules = page
    .locator("section")
    .filter({ hasText: "House rules" })
    .first();
  await expect(rules.getByText("Jam tamu maksimal 21.00")).toBeVisible();
  // The standard set is not replaced by the custom one.
  await expect(rules.getByText("Guests must be registered")).toBeVisible();
});

test("a room the owner adds is bookable, and the last one cannot be deleted", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await page.getByRole("button", { name: "Add room" }).click();
  await page.getByLabel("Room name").last().fill("Upstairs room");
  await page.getByLabel("Price", { exact: true }).last().fill("3000000");
  await page.getByLabel("Rooms free").last().fill("2");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();

  // The renter sees the new room in the comparison and can request it.
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await expect(page.getByText("Upstairs room").first()).toBeVisible();

  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);
  for (const name of ["Upstairs room", "Plus room", "Standard room"]) {
    await page.getByRole("button", { name: `Remove room: ${name}` }).click();
  }

  // A kos with no rooms cannot be priced or rented, so the last one stays.
  await expect(page.getByText("A kos needs at least one room.")).toBeVisible();
  await expect(page.getByLabel("Room name")).toHaveCount(1);
});

test("a cost the owner adds reaches renters with the reason behind it", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await page.getByLabel("Add cost").fill("Iuran kebersihan");
  await page.getByRole("button", { name: "Add cost" }).click();
  await page
    .getByLabel("Explanation: Iuran kebersihan")
    .fill("Ditagih tiap awal months bersama listrik.");
  await page.getByLabel("Amount").last().fill("50000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();

  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await page
    .getByRole("button", { name: "Iuran kebersihan — See how this charge works" })
    .click();

  // Papikos has no seeded copy for a charge it has never heard of, so the
  // owner's own words are the only explanation there is.
  const dialog = page.getByRole("dialog", { name: "Cost explanation" });
  await expect(dialog.getByText("Ditagih tiap awal months bersama listrik.")).toBeVisible();
  await expect(dialog.getByText(/does not process payments/)).toBeVisible();
});
