import { expect, test } from "@playwright/test";

import { openRequestDialog, waitForReady } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.waitForFunction(
    () => document.documentElement.dataset.papikosReady === "true",
  );
});

test("navigates to the search page via the header search bar", async ({
  page,
}) => {
  await page.getByRole("textbox", { name: "Location", exact: true }).fill("Bandung");
  await page.getByRole("button", { name: "Find a kos" }).click();

  await expect(page).toHaveURL(/\/kos\?q=Bandung/);
  await expect(page.getByText("Kos Asri Dago")).toBeVisible();
  await expect(page.getByText("Nara House Kemang")).toHaveCount(0);
});

test("shows a focused header search and a hero CTA into search", async ({
  page,
}) => {
  const header = page.getByRole("banner");
  await expect(header.getByLabel("Papikos")).toBeVisible();
  await expect(header.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/masuk",
  );
  await expect(header.getByRole("navigation")).toHaveCount(0);
  await expect(header.getByRole("textbox", { name: "Location" })).toBeVisible();

  const heroCta = page.getByRole("link", { name: "Start searching" });
  await expect(heroCta).toBeVisible();
  await expect(heroCta).toHaveAttribute("href", "/kos");
});

test("links popular locations and the explore-all CTA to the search page", async ({
  page,
}) => {
  const popularLocations = page.getByLabel("Popular locations", { exact: true });
  await expect(
    popularLocations.getByRole("link", { name: "Bandung" }),
  ).toHaveAttribute("href", "/kos?q=Bandung");
  await expect(
    popularLocations.getByRole("link", { name: "All", exact: true }),
  ).toHaveAttribute("href", "/kos");

  await expect(
    page.getByRole("link", { name: "See all kos" }),
  ).toHaveAttribute("href", "/kos");
});

test("supports reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();

  await expect(
    page.getByRole("heading", { name: "Kos worth a closer look" }),
  ).toBeVisible();
  const iterationCount = await page
    .locator(".map-float")
    .evaluate((element) => getComputedStyle(element).animationIterationCount);
  expect(iterationCount).not.toContain("infinite");
});

test("switches language and completes the preference survey", async ({
  page,
}) => {
  // The app opens in English; the toggle takes it to Indonesian and back.
  const languageControl = page.locator(".language-toggle");
  await languageControl.getByRole("button", { name: "ID", exact: true }).click();
  await expect(languageControl).toHaveAttribute("data-locale", "id");
  await expect(
    page.getByRole("heading", { name: /Temukan kos yang pas/i }),
  ).toBeVisible();

  await languageControl.getByRole("button", { name: "EN", exact: true }).click();
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

/* The dark-mode toggle is commented out for now:

test("persists dark mode across homepage and detail navigation", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Aktifkan mode gelap" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("papikos.theme")))
    .toBe('"dark"');

  await page.getByRole("link", { name: "View details" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Aktifkan mode terang" }),
  ).toBeVisible();
});

*/

test("persists a local booking request and structured question", async ({
  page,
}) => {
  await page.goto("/kos/senja-setiabudi");
  await page.waitForFunction(
    () => document.documentElement.dataset.papikosReady === "true",
  );

  // On mobile the only request CTA is the sticky bottom bar, which slides up
  // once the summary scrolls away, so scroll deliberately rather than relying
  // on an exact offset.
  await openRequestDialog(page);
  const bookingDialog = page.getByRole("dialog", {
    name: "Submit a rental request",
  });
  await expect(bookingDialog).toHaveAttribute("data-dialog-state", "open");
  await page.getByLabel("Room choice").selectOption("senja-setiabudi-plus");
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(
    page.getByRole("heading", { name: "Rental request submitted" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(bookingDialog).toHaveAttribute("data-dialog-state", "closing");
  await expect(bookingDialog).toHaveCount(0);

  await page
    .getByLabel("Your question")
    .fill("Apakah saya boleh membawa kursi kerja sendiri?");
  await page.getByRole("button", { name: "Submit question" }).click();
  await expect(
    page.getByText("Question saved for the owner (prototype)."),
  ).toBeVisible();
  await expect(
    page.getByText("Apakah saya boleh membawa kursi kerja sendiri?"),
  ).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByText("Apakah saya boleh membawa kursi kerja sendiri?"),
  ).toHaveCount(0);
  await openRequestDialog(page);
  await expect(
    page.getByRole("heading", { name: "Rental request submitted" }),
  ).toBeVisible();
});

test("browses the kos gallery and opens a photo full size", async ({ page }) => {
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);

  await expect(page.getByText("1 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Next photo" }).click();
  await expect(page.getByText("2 of 5")).toBeVisible();

  await page.getByRole("button", { name: "Go to photo 4" }).click();
  await expect(page.getByText("4 of 5")).toBeVisible();

  await page.getByRole("button", { name: "View this photo larger" }).click();
  const dialog = page.getByRole("dialog", { name: "Photo gallery" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("4 of 5")).toBeVisible();

  // Escape closes it, and the page keeps the photo the dialog was left on.
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("4 of 5")).toBeVisible();
});
