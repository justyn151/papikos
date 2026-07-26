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
  await page.getByLabel("Lokasi").fill("Bandung");
  await page.getByRole("button", { name: "Cari kos" }).click();

  await expect(page).toHaveURL(/\?q=Bandung/);
  await expect(page.getByText("Kos Asri Dago")).toBeVisible();
  await expect(page.getByText("Nara House Kemang")).toHaveCount(0);
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
