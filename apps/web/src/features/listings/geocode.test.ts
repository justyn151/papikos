import { afterEach, describe, expect, it, vi } from "vitest";

import { describePoint } from "./geocode";

const jakarta = { lat: -6.2087634, lng: 106.8455931 };

function respondWith(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("describePoint", () => {
  it("asks about the rounded point, never the exact one", async () => {
    const fetchMock = respondWith({ address: { suburb: "Setiabudi" } });

    await describePoint(jakarta);

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    // The precision the app stores is the precision it discloses to a third
    // party, which is the whole point of rounding before anything else.
    expect(url.searchParams.get("lat")).toBe("-6.209");
    expect(url.searchParams.get("lon")).toBe("106.846");
  });

  it("prefers the neighbourhood over the wider administrative name", async () => {
    respondWith({
      address: {
        suburb: "Setiabudi",
        city_district: "Jakarta Selatan",
        city: "Jakarta",
      },
    });

    expect(await describePoint(jakarta)).toEqual({
      district: "Setiabudi",
      city: "Jakarta",
      area: "Setiabudi, Jakarta",
    });
  });

  it("falls back through the names a rural point actually carries", async () => {
    respondWith({ address: { village: "Mlati", county: "Sleman" } });

    expect(await describePoint(jakarta)).toMatchObject({
      district: "Mlati",
      city: "Sleman",
    });
  });

  it("says nothing rather than guessing when the service is unhelpful", async () => {
    respondWith({ address: {} });
    expect(await describePoint(jakarta)).toBeNull();

    respondWith({}, false);
    expect(await describePoint(jakarta)).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    // A failed lookup must leave the owner's own text alone, so the caller
    // needs a null it can ignore rather than an exception.
    expect(await describePoint(jakarta)).toBeNull();
  });

  it("refuses a point that is not plausibly in Indonesia", async () => {
    const fetchMock = respondWith({ address: { suburb: "Nowhere" } });

    expect(await describePoint({ lat: 51.5, lng: -0.12 })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
