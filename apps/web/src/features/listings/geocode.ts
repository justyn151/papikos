import { approximate, isPlausibleCoordinate, type Coordinates } from "./location";

/**
 * Nominatim, OpenStreetMap's own geocoder. No key, and the same data behind
 * the tiles, but a strict usage policy: it is called only when an owner asks
 * for it — the locate button — never while they drag the map.
 *
 * Everything it returns is a suggestion. The owner edits the area text
 * afterwards, because a geocoder that is confidently wrong about a
 * neighbourhood is worse than one that says nothing.
 */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

export interface LocatedPlace {
  district: string;
  city: string;
  area: string;
}

interface NominatimAddress {
  suburb?: string;
  village?: string;
  neighbourhood?: string;
  city_district?: string;
  city?: string;
  town?: string;
  county?: string;
  state?: string;
}

function pick(address: NominatimAddress, keys: (keyof NominatimAddress)[]) {
  for (const key of keys) {
    const value = address[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/**
 * Turns a point into district and city names, or null when the service is
 * unreachable or unsure. Callers keep whatever the owner already typed in that
 * case: a failed lookup must never blank a field.
 */
export async function describePoint(
  point: Coordinates,
  signal?: AbortSignal,
): Promise<LocatedPlace | null> {
  if (!isPlausibleCoordinate(point)) return null;

  const rounded = approximate(point);
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(rounded.lat));
  url.searchParams.set("lon", String(rounded.lng));
  // Neighbourhood level: asking for a building would return the address this
  // app has spent its design deliberately not showing.
  url.searchParams.set("zoom", "14");
  url.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { address?: NominatimAddress };
    const address = body.address;
    if (!address) return null;

    const district = pick(address, [
      "suburb",
      "village",
      "neighbourhood",
      "city_district",
    ]);
    const city = pick(address, ["city", "town", "county", "state"]);
    if (!district && !city) return null;

    return {
      district,
      city,
      area: [district, city].filter(Boolean).join(", "),
    };
  } catch {
    // Offline, blocked, rate-limited, or aborted: the owner types it instead.
    return null;
  }
}

/** Wraps the browser's geolocation in a promise, with a bounded wait. */
export function currentPosition(): Promise<Coordinates | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      // Denied, unavailable, or timed out are all the same to the caller: no
      // point, keep what is on screen.
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  });
}
