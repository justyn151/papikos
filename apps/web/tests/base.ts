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
 * Map tiles come from a third party, which the suite must not depend on: a
 * test should not fail because someone else is slow, and a CI run should not
 * send them traffic their policy asks us not to send. Everything the app
 * itself draws — the privacy circle, the attribution, the pin, the controls —
 * is still real.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/basemaps\.cartocdn\.com|tile\.openstreetmap\.org/, (route) =>
      route.fulfill({ body: BLANK_TILE, contentType: "image/png", status: 200 }),
    );
    // The same argument for the geocoder, which the editor calls whenever the
    // pin moves. A test that names its own place wins: Playwright matches the
    // most recently added route first.
    await page.route(/nominatim\.openstreetmap\.org/, (route) =>
      route.fulfill({
        body: JSON.stringify({
          address: { suburb: "Setiabudi", city: "Jakarta" },
        }),
        contentType: "application/json",
        status: 200,
      }),
    );
    await use(page);
  },
});

export { expect };
