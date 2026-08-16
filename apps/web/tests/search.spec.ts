import { expect, test } from "@playwright/test";

async function waitForReady(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => document.documentElement.dataset.papikosReady === "true",
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("header search on the homepage lands on /kos with results", async ({
  page,
}) => {
  await page.reload();
  await waitForReady(page);

  await page.getByRole("textbox", { name: "Lokasi", exact: true }).fill("Jakarta");
  await page.getByRole("button", { name: "Cari kos" }).click();

  await expect(page).toHaveURL(/\/kos\?q=Jakarta/);
  await expect(page.getByText("Papikos Senja Setiabudi")).toBeVisible();
  await expect(page.getByText("Kos Asri Dago")).toHaveCount(0);
});

test("combines location, room type, price range, and amenities, and survives a reload", async ({
  page,
}) => {
  await page.goto("/kos");
  await waitForReady(page);

  await page.getByRole("textbox", { name: "Lokasi", exact: true }).fill("Jakarta");
  await page.getByRole("button", { name: "Cari kos" }).click();
  await expect(page).toHaveURL(/q=Jakarta/);

  await page.getByRole("button", { name: "Campur", exact: true }).click();
  await expect(page).toHaveURL(/type=campur/);

  const maxPriceSlider = page.getByLabel("Harga maksimum");
  await maxPriceSlider.focus();
  // Default is 3,000,000; step down by 50,000 x 8 to reach 2,600,000.
  for (let i = 0; i < 8; i += 1) {
    await maxPriceSlider.press("ArrowLeft");
  }
  await expect(page).toHaveURL(/max=2600000/);

  await page.getByRole("button", { name: "AC", exact: true }).click();
  await expect(page).toHaveURL(/amenities=ac/);

  await expect(page.getByText("Papikos Senja Setiabudi")).toBeVisible();
  // Excluded by the room-type filter rather than by price: Kos Melati Tebet is
  // in Jakarta and within budget, but it is putri, not campur.
  await expect(page.getByText("Kos Melati Tebet")).toHaveCount(0);
  // Nara House Kemang lists at 2,850,000 but is discounted to 2,450,000, so it
  // belongs in a 2,600,000 budget.
  await expect(page.getByText("Nara House Kemang")).toBeVisible();

  const url = page.url();
  await page.reload();
  await waitForReady(page);

  await expect(page).toHaveURL(url);
  await expect(page.getByText("Papikos Senja Setiabudi")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Campur", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "AC", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("shows an empty state and resets via the clear-filters control", async ({
  page,
}) => {
  await page.goto("/kos?q=Atlantis");
  await waitForReady(page);

  await expect(page.getByText("Belum ada kos yang cocok")).toBeVisible();

  await page.getByRole("button", { name: "Atur ulang pencarian" }).click();

  await expect(page.getByText("Papikos Senja Setiabudi")).toBeVisible();
  await expect(page).toHaveURL(/\/kos$/);
});

test("clears all filters via the filter panel's clear control", async ({
  page,
}) => {
  await page.goto("/kos?q=Bandung&type=putri");
  await waitForReady(page);

  await page.getByRole("button", { name: "Hapus semua filter" }).click();

  await expect(page).toHaveURL(/\/kos$/);
  await expect(page.getByText("Nara House Kemang")).toBeVisible();
});

test("opens a kos detail page from search results and browser back returns to them", async ({
  page,
}) => {
  await page.goto("/kos?q=Jakarta");
  await waitForReady(page);

  await page.getByRole("link", { name: "Lihat detail" }).first().click();
  await expect(page).toHaveURL(/\/kos\/senja-setiabudi/);
  await expect(
    page.getByRole("heading", { name: "Papikos Senja Setiabudi" }),
  ).toBeVisible();

  // The page carries no back link of its own: it is reached from search, the
  // homepage, favorites, and both consoles, and only browser history knows
  // which of those the renter actually came from.
  await expect(
    page.getByRole("link", { name: "Kembali ke hasil" }),
  ).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/\/kos\?q=Jakarta/);
  await expect(page.getByText("Papikos Senja Setiabudi")).toBeVisible();
});

test("amenities filter requires every selected amenity (AND semantics)", async ({
  page,
}) => {
  await page.goto("/kos");
  await waitForReady(page);

  await page.getByRole("button", { name: "Dapur", exact: true }).click();
  await page.getByRole("button", { name: "Laundry", exact: true }).click();

  await expect(page).toHaveURL(/amenities=/);
  await expect(page.getByText("Omah Pogung Ceria")).toBeVisible();
  await expect(page.getByText("Taman Rungkut Putri")).toBeVisible();
  await expect(page.getByText("Kos Asri Dago")).toHaveCount(0);
  await expect(page.getByText("Nara House Kemang")).toHaveCount(0);
});

test("availability and verified toggles narrow results and survive a reload", async ({
  page,
}) => {
  await page.goto("/kos");
  await waitForReady(page);

  // Kos Melati Tebet is fully booked; Ruang Teduh Keputih is unverified.
  await expect(page.getByText("Kos Melati Tebet")).toBeVisible();
  await expect(page.getByText("Ruang Teduh Keputih")).toBeVisible();

  await page.getByRole("checkbox", { name: "Masih ada kamar kosong" }).check();
  await expect(page).toHaveURL(/available=1/);
  await expect(page.getByText("Kos Melati Tebet")).toHaveCount(0);

  await page.getByRole("checkbox", { name: "Hanya kos terverifikasi" }).check();
  await expect(page).toHaveURL(/verified=1/);
  await expect(page.getByText("Ruang Teduh Keputih")).toHaveCount(0);

  await page.reload();
  await waitForReady(page);

  await expect(
    page.getByRole("checkbox", { name: "Masih ada kamar kosong" }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Hanya kos terverifikasi" }),
  ).toBeChecked();
  await expect(page.getByText("Kos Melati Tebet")).toHaveCount(0);
  await expect(page.getByText("Ruang Teduh Keputih")).toHaveCount(0);
});

test("shows facet counts and disables options that would return nothing", async ({
  page,
}) => {
  await page.goto("/kos?amenities=privateBathroom,motorParking");
  await waitForReady(page);

  // Three kos have a private bathroom and motorbike parking, but none of them
  // also has laundry, so that chip is a dead end and must not be selectable.
  const laundryChip = page.getByRole("button", { name: "Laundry", exact: true });
  await expect(laundryChip).toBeDisabled();
  await expect(laundryChip).toContainText("0");

  const wifiChip = page.getByRole("button", { name: "Wi-Fi", exact: true });
  await expect(wifiChip).toBeEnabled();
  await expect(wifiChip).toContainText("3");
});
