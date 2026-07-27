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

  await page
    .getByLabel("Lokasi populer", { exact: true })
    .getByRole("button", { name: "Semua", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Nara House Kemang")).toBeVisible();
});

test("uses concise all labels and supports reduced motion", async ({ page }) => {
  await expect(
    page
      .getByLabel("Lokasi populer", { exact: true })
      .getByRole("button", { name: "Semua", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Tipe kos", { exact: true })
      .getByRole("button", { name: "Semua", exact: true }),
  ).toBeVisible();

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

test("opens a complete kos detail page and preserves the search return path", async ({
  page,
}) => {
  await page.getByRole("textbox", { name: "Lokasi", exact: true }).fill("Jakarta");
  await page.getByRole("button", { name: "Cari kos" }).click();
  await page.getByRole("link", { name: "Lihat detail" }).first().click();

  await expect(page).toHaveURL(/\/kos\/senja-setiabudi/);
  await expect(
    page.getByRole("heading", { name: "Papikos Senja Setiabudi" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rincian biaya" })).toBeVisible();
  await expect(page.getByText("Tidak ada deposit")).toBeVisible();
  await expect(page.getByText("Kamar utama · 1/5")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pilih kamar" })).toHaveCount(0);

  await page.getByRole("link", { name: "Kembali ke hasil" }).click();
  await expect(page).toHaveURL(/\?q=Jakarta/);
  await expect(page.getByText("Nara House Kemang")).toBeVisible();
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
  await expect(requestCta).toHaveClass(/request-cta/);
  await requestCta.click();
  await page.getByLabel("Pilihan kamar").selectOption("senja-setiabudi-plus");
  await page.getByRole("button", { name: "Kirim permintaan" }).click();
  await expect(
    page.getByRole("heading", { name: "Permintaan sewa terkirim" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup" }).click();

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
