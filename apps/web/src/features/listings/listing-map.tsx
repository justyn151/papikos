"use client";

import "leaflet/dist/leaflet.css";

import { Circle, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

import type { Coordinates } from "./location";

/**
 * OpenStreetMap's own tiles: no key, no account, and no environment to
 * configure. Their tile policy rules out production traffic, so this is a
 * prototype choice — swapping in a keyed provider is this one URL plus the
 * attribution below it. Attribution is required whatever the provider.
 */
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function ClickToMove({ onMove }: { onMove: (next: Coordinates) => void }) {
  useMapEvents({
    click: (event) => onMove({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
}

/**
 * A kos on a map, drawn as the area it is in rather than the building it is.
 * There is no marker on purpose: a pin claims a precision this deliberately
 * does not have, and the stored coordinate is rounded before it ever reaches
 * the browser (see `location.ts`).
 */
export function ListingMap({
  centre,
  radiusMeters,
  label,
  interactive = false,
  onMove,
  zoom = 14,
}: {
  centre: Coordinates;
  radiusMeters: number;
  label: string;
  /** Owner-side: the map takes a click to move the circle. */
  interactive?: boolean;
  onMove?: (next: Coordinates) => void;
  zoom?: number;
}) {
  return (
    // The label lives here rather than on the map: `MapContainer` forwards its
    // own props to Leaflet, not to the element.
    <div aria-label={label} className="h-full w-full" role="group">
      <MapContainer
        attributionControl
        center={[centre.lat, centre.lng]}
        className="h-full w-full"
        doubleClickZoom={interactive}
        dragging={interactive}
        scrollWheelZoom={false}
        zoom={zoom}
        zoomControl={interactive}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <Circle
          center={[centre.lat, centre.lng]}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.18,
            weight: 2,
          }}
          radius={radiusMeters}
        />
        {interactive && onMove ? <ClickToMove onMove={onMove} /> : null}
      </MapContainer>
    </div>
  );
}

export default ListingMap;
