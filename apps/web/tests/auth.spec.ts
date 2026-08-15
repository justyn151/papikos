import { expect, test } from "@playwright/test";

async function waitForReady(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => document.documentElement.dataset.papikosReady === "true",
  );
}

test("reaches the login page from the header and moves between auth pages", async ({
  page,
}) => {
  await page.goto("/");
  await waitForReady(page);

  await page.getByRole("banner").getByRole("link", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(
    page.getByRole("heading", { name: "Masuk ke Papikos" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Daftar sekarang" }).click();
  await expect(page).toHaveURL(/\/daftar$/);
  await expect(
    page.getByRole("heading", { name: "Buat akun Papikos" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Masuk di sini" }).click();
  await expect(page).toHaveURL(/\/masuk$/);
});

test("blocks an invalid sign-in and confirms a valid one without a session", async ({
  page,
}) => {
  await page.goto("/masuk");
  await waitForReady(page);

  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Wajib diisi.").first()).toBeVisible();

  await page.getByLabel("Email").fill("renter@papikos.id");
  await page.getByLabel("Kata sandi", { exact: true }).fill("kosidaman1");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page.getByText("Form masuk tervalidasi")).toBeVisible();

  // The prototype must not mint a session or keep the password anywhere.
  const stored = await page.evaluate(() => JSON.stringify(window.localStorage));
  expect(stored).not.toContain("kosidaman1");
});

test("validates the registration form and supports the owner role", async ({
  page,
}) => {
  await page.goto("/daftar");
  await waitForReady(page);

  await page.getByRole("button", { name: "Menyewakan kos" }).click();
  await expect(
    page.getByRole("button", { name: "Menyewakan kos" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("Nama lengkap").fill("Sinta");
  await page.getByLabel("Email").fill("sinta@papikos.id");
  await page.getByLabel("Nomor HP").fill("081234567890");
  await page.getByLabel("Kata sandi", { exact: true }).fill("kosidaman1");
  await page.getByLabel("Ulangi kata sandi").fill("kosidaman2");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Daftar" }).click();

  await expect(page.getByText("Kata sandi tidak sama.")).toBeVisible();

  await page.getByLabel("Ulangi kata sandi").fill("kosidaman1");
  await page.getByRole("button", { name: "Daftar" }).click();

  await expect(page.getByText("Form pendaftaran tervalidasi")).toBeVisible();
});

test("switches auth copy to English", async ({ page }) => {
  await page.goto("/masuk");
  await waitForReady(page);

  await page
    .locator(".language-toggle")
    .getByRole("button", { name: "EN", exact: true })
    .click();

  await expect(
    page.getByRole("heading", { name: "Sign in to Papikos" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});
