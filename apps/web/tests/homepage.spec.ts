import { expect, test } from "@playwright/test";

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
  await page.getByRole("textbox", { name: "Lokasi", exact: true }).fill("Bandung");
  await page.getByRole("button", { name: "Cari kos" }).click();

  await expect(page).toHaveURL(/\/kos\?q=Bandung/);
  await expect(page.getByText("Kos Asri Dago")).toBeVisible();
  await expect(page.getByText("Nara House Kemang")).toHaveCount(0);
});

test("shows a focused header search and a hero CTA into search", async ({
  page,
}) => {
  const header = page.getByRole("banner");
  await expect(header.getByLabel("Papikos")).toBeVisible();
  await expect(header.getByRole("link", { name: "Masuk" })).toHaveAttribute(
    "href",
    "/masuk",
  );
  await expect(header.getByRole("navigation")).toHaveCount(0);
  await expect(header.getByRole("textbox", { name: "Lokasi" })).toBeVisible();

  const heroCta = page.getByRole("link", { name: "Mulai cari kos" });
  await expect(heroCta).toBeVisible();
  await expect(heroCta).toHaveAttribute("href", "/kos");
});

test("links popular locations and the explore-all CTA to the search page", async ({
  page,
}) => {
  const popularLocations = page.getByLabel("Lokasi populer", { exact: true });
  await expect(
    popularLocations.getByRole("link", { name: "Bandung" }),
  ).toHaveAttribute("href", "/kos?q=Bandung");
  await expect(
    popularLocations.getByRole("link", { name: "Semua", exact: true }),
  ).toHaveAttribute("href", "/kos");

  await expect(
    page.getByRole("link", { name: "Lihat semua kos" }),
  ).toHaveAttribute("href", "/kos");
});

test("supports reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();

  await expect(
    page.getByRole("heading", { name: "Kos yang layak dilihat" }),
  ).toBeVisible();
  const iterationCount = await page
    .locator(".map-float")
    .evaluate((element) => getComputedStyle(element).animationIterationCount);
  expect(iterationCount).not.toContain("infinite");
});

test("switches language and completes the preference survey", async ({
  page,
}) => {
  const languageControl = page.locator(".language-toggle");
  await languageControl.getByRole("button", { name: "EN", exact: true }).click();
  await expect(languageControl).toHaveAttribute("data-locale", "en");
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

  await page.getByRole("link", { name: "Lihat detail" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Aktifkan mode terang" }),
  ).toBeVisible();
});

test("persists a local booking request and structured question", async ({
  page,
}) => {
  await page.goto("/kos/senja-setiabudi");
  await page.waitForFunction(
    () => document.documentElement.dataset.papikosReady === "true",
  );

  await page
    .getByRole("heading", { name: "Pilihan kamar" })
    .scrollIntoViewIfNeeded();
  const requestCta = page
    .locator("button:visible")
    .filter({ hasText: "Ajukan sewa" })
    .first();
  await expect(requestCta).toBeVisible();
  await requestCta.click();
  const bookingDialog = page.getByRole("dialog", {
    name: "Ajukan permintaan sewa",
  });
  await expect(bookingDialog).toHaveAttribute("data-dialog-state", "open");
  await page.getByLabel("Pilihan kamar").selectOption("senja-setiabudi-plus");
  await page.getByRole("button", { name: "Kirim permintaan" }).click();
  await expect(
    page.getByRole("heading", { name: "Permintaan sewa terkirim" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup" }).click();
  await expect(bookingDialog).toHaveAttribute("data-dialog-state", "closing");
  await expect(bookingDialog).toHaveCount(0);

  await page
    .getByLabel("Pertanyaanmu")
    .fill("Apakah saya boleh membawa kursi kerja sendiri?");
  await page.getByRole("button", { name: "Kirim pertanyaan" }).click();
  await expect(
    page.getByText("Pertanyaan tersimpan untuk pemilik (prototipe)."),
  ).toBeVisible();
  await expect(
    page.getByText("Apakah saya boleh membawa kursi kerja sendiri?"),
  ).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByText("Apakah saya boleh membawa kursi kerja sendiri?"),
  ).toHaveCount(0);
  await page
    .getByRole("heading", { name: "Pilihan kamar" })
    .scrollIntoViewIfNeeded();
  await page
    .locator("button:visible")
    .filter({ hasText: "Ajukan sewa" })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Permintaan sewa terkirim" }),
  ).toBeVisible();
});
