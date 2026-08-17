import { expect, type Page } from "@playwright/test";

export async function waitForReady(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.dataset.papikosReady === "true",
  );
}

/**
 * The kos detail page exposes its request CTA differently per layout: desktop
 * has a sticky sidebar card, mobile a sticky bottom bar that only slides up
 * once the summary scrolls away. Each needs a different scroll position, so
 * branch explicitly rather than pick an offset that happens to suit one.
 */
export async function openRequestDialog(page: Page) {
  const isNarrow = (page.viewportSize()?.width ?? 0) < 1024;

  if (isNarrow) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  } else {
    await page
      .getByRole("heading", { name: "Cost breakdown" })
      .scrollIntoViewIfNeeded();
  }

  const cta = page
    .locator("button:visible")
    .filter({ hasText: "Request to rent" })
    .first();
  await expect(cta).toBeInViewport();
  await cta.click();
}
