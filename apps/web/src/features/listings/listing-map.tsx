"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { Circle, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { Coordinates } from "./location";

/**
 * CARTO's Positron basemap, drawn from OpenStreetMap data. Still no key and no
 * environment to configure, but a far quieter surface than OSM's default
 * raster: muted greys and thin roads, so the kos circle is the loudest thing
 * on the map rather than competing with motorway shields.
 *
 * Swapping providers is this URL and the attribution under it. Both credits
 * are required — CARTO's terms for the tiles, OpenStreetMap's licence for the
 * data behind them.
 */
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Reports where the map is pointed once it stops moving. This is the Gojek and
 * Grab pattern: the pin is painted at the centre of the frame and the map
 * slides underneath it, which beats aiming a fingertip at a point on a phone.
 */
function ReportCentre({ onPick }: { onPick: (next: Coordinates) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const centre = map.getCenter();
      onPick({ lat: centre.lat, lng: centre.lng });
    },
  });
  return null;
}

/** Recentres the map when the point changes from outside it — the locate button. */
function FollowCentre({ centre }: { centre: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    const current = map.getCenter();
    // Only when the difference is real: echoing every `moveend` back into the
    // map would fight the hand that is dragging it.
    if (Math.abs(current.lat - centre.lat) + Math.abs(current.lng - centre.lng) > 1e-4) {
      map.setView([centre.lat, centre.lng], map.getZoom());
    }
  }, [centre.lat, centre.lng, map]);

  return null;
}

/**
 * A kos on a map, drawn as the area it is in rather than the building it is.
 * There is no marker in reading mode on purpose: a pin claims a precision this
 * deliberately does not have, and the stored coordinate is rounded before it
 * ever reaches the browser (see `location.ts`).
 */
export function ListingMap({
  centre,
  radiusMeters,
  label,
  picking = false,
  onPick,
  zoom = 15,
}: {
  centre: Coordinates;
  radiusMeters: number;
  label: string;
  /** Owner-side: the map slides under a fixed pin to choose the point. */
  picking?: boolean;
  onPick?: (next: Coordinates) => void;
  zoom?: number;
}) {
  return (
    // The label lives here rather than on the map: `MapContainer` forwards its
    // own props to Leaflet, not to the element.
    <div aria-label={label} className="relative h-full w-full" role="group">
      <MapContainer
        attributionControl
        center={[centre.lat, centre.lng]}
        className="h-full w-full"
        // Panning and zooming are on everywhere: a map a renter cannot move is
        // a picture. Only the wheel stays off, so scrolling the page past the
        // map does not zoom it by accident.
        doubleClickZoom
        dragging
        scrollWheelZoom={false}
        zoom={zoom}
        zoomControl
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <Circle
          center={[centre.lat, centre.lng]}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.16,
            weight: 2,
          }}
          radius={radiusMeters}
        />
        {picking && onPick ? <ReportCentre onPick={onPick} /> : null}
        {picking ? <FollowCentre centre={centre} /> : null}
      </MapContainer>

      {picking ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full"
        >
          <span className="block size-7 rounded-full border-[5px] border-white bg-blue-600 shadow-lg" />
          <span className="mx-auto block h-3 w-0.5 bg-blue-600" />
        </span>
      ) : null}
    </div>
  );
}

export default ListingMap;
