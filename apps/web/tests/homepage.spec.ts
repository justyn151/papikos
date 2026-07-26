import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.waitForFunction(
    () => document.documentElement.dataset.papikosReady === "true",
  );
});

test("searches mock listings and preserves the query in the URL", async ({
  page,
}) => {
  await page.getByRole("textbox", { name: "Lokasi", exact: true }).fill("Bandung");
  await page.getByRole("button", { name: "Cari kos" }).click();

  await expect(page).toHaveURL(/\?q=Bandung/);
  await expect(page.getByText("Kos Asri Dago")).toBeVisible();
  await expect(page.getByText("Nara House Kemang")).toHaveCount(0);
});

test("shows a focused header and location-only hero", async ({ page }) => {
  const header = page.getByRole("banner");
  await expect(header.getByLabel("Papikos")).toBeVisible();
  await expect(header.getByRole("button", { name: "Masuk" })).toBeVisible();
  await expect(header.getByRole("navigation")).toHaveCount(0);
  await expect(
    header.getByRole("button", { name: "Daftarkan kos" }),
  ).toHaveCount(0);

  const searchForm = page
    .getByRole("button", { name: "Cari kos" })
    .locator("xpath=ancestor::form");
  await expect(searchForm.getByRole("textbox")).toHaveCount(1);
  await expect(searchForm.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByText("4 kota demo")).toHaveCount(0);
});

test("filters by a popular location and restores all locations", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Bandung" }).click();
  await expect(page).toHaveURL(/\?q=Bandung/);
  await expect(page.getByText("Kos Asri Dago")).toBeVisible();

  await page.getByRole("button", { name: "Semua", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Nara House Kemang")).toBeVisible();
});

test("switches language and completes the preference survey", async ({
  page,
}) => {
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Find a kos that fits your life/i }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Try the preference survey" })
    .click();
  await page.getByRole("button", { name: "Show my matches" }).click();

  await expect(
    page.getByText("Recommendations from your preferences"),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Find a kos that fits your life/i }),
  ).toBeVisible();
});
