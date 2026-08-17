/* eslint-disable react-hooks/rules-of-hooks --
   Playwright fixtures hand control back through a callback named `use`, which
   the React hooks rule reads as a hook call. */
import { test as base, expect } from "@playwright/test";

/** A 1x1 transparent PNG, enough for Leaflet to consider a tile loaded. */
const BLANK_TILE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * Map tiles come from OpenStreetMap's servers, which the suite must not depend
 * on: a test should not fail because a third party is slow, and a CI run should
 * not send them traffic their tile policy asks us not to send. Everything the
 * app itself draws — the privacy circle, the attribution, the controls — is
 * still real.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/tile\.openstreetmap\.org/, (route) =>
      route.fulfill({ body: BLANK_TILE, contentType: "image/png", status: 200 }),
    );
    await use(page);
  },
});

export { expect };
