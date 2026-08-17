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

  await page.getByRole("banner").getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to Papikos" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Create one" }).click();
  await expect(page).toHaveURL(/\/daftar$/);
  await expect(
    page.getByRole("heading", { name: "Create a Papikos account" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Sign in here" }).click();
  await expect(page).toHaveURL(/\/masuk$/);
});

test("blocks an invalid sign-in and confirms a valid one without a session", async ({
  page,
}) => {
  await page.goto("/masuk");
  await waitForReady(page);

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("This field is required.").first()).toBeVisible();

  await page.getByLabel("Email").fill("renter@papikos.id");
  await page.getByLabel("Password", { exact: true }).fill("kosidaman1");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Sign-in form validated")).toBeVisible();

  // The prototype must not mint a session or keep the password anywhere.
  const stored = await page.evaluate(() => JSON.stringify(window.localStorage));
  expect(stored).not.toContain("kosidaman1");
});

test("validates the registration form and supports the owner role", async ({
  page,
}) => {
  await page.goto("/daftar");
  await waitForReady(page);

  await page.getByRole("button", { name: "List a kos" }).click();
  await expect(
    page.getByRole("button", { name: "List a kos" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("Full name").fill("Sinta");
  await page.getByLabel("Email").fill("sinta@papikos.id");
  await page.getByLabel("Phone number").fill("081234567890");
  await page.getByLabel("Password", { exact: true }).fill("kosidaman1");
  await page.getByLabel("Repeat password").fill("kosidaman2");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page.getByText("Passwords do not match.")).toBeVisible();

  await page.getByLabel("Repeat password").fill("kosidaman1");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page.getByText("Sign-up form validated")).toBeVisible();
});

test("switches auth copy between languages", async ({ page }) => {
  await page.goto("/masuk");
  await waitForReady(page);

  // The page opens in English, so the switch is what has to be proven here.
  await expect(
    page.getByRole("heading", { name: "Sign in to Papikos" }),
  ).toBeVisible();

  await page
    .locator(".language-toggle")
    .getByRole("button", { name: "ID", exact: true })
    .click();

  await expect(
    page.getByRole("heading", { name: "Masuk ke Papikos" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk", exact: true })).toBeVisible();
});
