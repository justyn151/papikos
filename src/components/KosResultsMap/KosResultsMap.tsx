import { useEffect } from 'react'
import { divIcon } from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { KosSearchRecord } from '../../types/search'
import { formatRupiah } from '../../utils/formatCurrency'

type KosResultsMapProps = {
  records: KosSearchRecord[]
  resizeKey: number
  onOpenListing: (listingId: number) => void
}

function compactPrice(price: number) {
  if (price >= 1000000) {
    return `Rp${(price / 1000000).toLocaleString('id-ID', {
      maximumFractionDigits: 1,
    })}jt`
  }
  return `Rp${Math.round(price / 1000)}rb`
}

function markerColor(tag: KosSearchRecord['tag']) {
  if (tag === 'Putri') return '#ec4899'
  if (tag === 'Putra') return '#3b82f6'
  return '#8b5cf6'
}

function MapViewport({ records, resizeKey }: Pick<KosResultsMapProps, 'records' | 'resizeKey'>) {
  const map = useMap()
  const recordKey = records.map((record) => record.id).join(',')

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize())
    return () => window.cancelAnimationFrame(frame)
  }, [map, resizeKey])

  useEffect(() => {
    if (records.length === 0) return

    map.fitBounds(
      records.map((record) => [record.coordinates.lat, record.coordinates.lng]),
      { padding: [48, 48], maxZoom: 15 },
    )
  }, [map, recordKey, records])

  return null
}

export function KosResultsMap({
  records,
  resizeKey,
  onOpenListing,
}: KosResultsMapProps) {
  return (
    <MapContainer
      center={[-2.5489, 118.0149]}
      className="h-full w-full"
      scrollWheelZoom
      zoom={5}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport records={records} resizeKey={resizeKey} />

      {records.map((record) => (
        <Marker
          icon={divIcon({
            className: 'kos-map-marker-container',
            html: `<span class="kos-map-price-marker" style="--marker-color:${markerColor(record.tag)}">${compactPrice(record.monthlyPrice)}</span>`,
            iconAnchor: [36, 18],
            iconSize: [72, 36],
          })}
          key={record.id}
          position={[record.coordinates.lat, record.coordinates.lng]}
        >
          <Popup minWidth={210}>
            <div className="space-y-2">
              <p className="m-0 text-sm font-black text-neutral-800">{record.name}</p>
              <p className="m-0 text-xs leading-5 text-neutral-500">{record.address}</p>
              <p className="m-0 font-black text-green-700">
                {formatRupiah(record.monthlyPrice)}/bulan
              </p>
              <button
                className="w-full rounded-lg bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700"
                onClick={() => onOpenListing(record.listingId)}
                type="button"
              >
                Lihat detail
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
