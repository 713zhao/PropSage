import 'leaflet/dist/leaflet.css'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import { getDistricts, getAmenities, type DistrictData, type AmenityPoint } from '../api/map'

function psfColor(psf: number): string {
  if (psf >= 2500) return '#ef4444'
  if (psf >= 1800) return '#f97316'
  if (psf >= 1400) return '#eab308'
  if (psf >= 1000) return '#22c55e'
  return '#3b82f6'
}

function formatSgd(n: number): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n)
}

function amenityIcon(type: string): L.DivIcon {
  const colors: Record<string, string> = { mrt: '#a855f7', school: '#22d3ee', mall: '#fb923c' }
  const labels: Record<string, string> = { mrt: 'M', school: 'S', mall: '🛍' }
  const bg = colors[type] ?? '#6b7280'
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.5)">${labels[type] ?? '?'}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export function MapPage() {
  const [districts, setDistricts] = useState<DistrictData[]>([])
  const [amenities, setAmenities] = useState<AmenityPoint[]>([])
  const [layers, setLayers] = useState({ mrt: false, school: false, mall: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDistricts()
      .then(setDistricts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function toggleLayer(type: 'mrt' | 'school' | 'mall') {
    const next = !layers[type]
    setLayers((l) => ({ ...l, [type]: next }))
    if (next && !amenities.some((a) => a.type === type)) {
      try {
        const pts = await getAmenities(type)
        setAmenities((prev) => [...prev.filter((a) => a.type !== type), ...pts])
      } catch {
        // ignore amenity fetch errors silently
      }
    }
  }

  const visibleAmenities = amenities.filter((a) => layers[a.type as keyof typeof layers])

  return (
    <div className="-m-6">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-400">District Map</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Circle size + colour = PSF median · click a district for details
          </p>
        </div>
        <div className="flex gap-2">
          {(['mrt', 'school', 'mall'] as const).map((type) => {
            const labels = { mrt: 'MRT', school: 'Schools', mall: 'Malls' }
            const activeColors = {
              mrt: 'bg-purple-700 text-white',
              school: 'bg-cyan-700 text-white',
              mall: 'bg-orange-700 text-white',
            }
            return (
              <button
                key={type}
                onClick={() => toggleLayer(type)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  layers[type] ? activeColors[type] : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {labels[type]}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center text-gray-500 py-20">Loading map data...</div>
      )}
      {error && (
        <div className="flex items-center justify-center text-red-400 py-20">{error}</div>
      )}

      {!loading && !error && (
        <div className="relative">
          {/* PSF colour legend */}
          <div className="absolute bottom-6 left-4 z-[1000] bg-gray-900/90 border border-gray-700 rounded-lg p-3 pointer-events-none">
            <p className="text-xs text-gray-400 font-medium mb-2">PSF Median</p>
            {[
              { label: '≥ $2,500', color: '#ef4444' },
              { label: '≥ $1,800', color: '#f97316' },
              { label: '≥ $1,400', color: '#eab308' },
              { label: '≥ $1,000', color: '#22c55e' },
              { label: '< $1,000', color: '#3b82f6' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.color }} />
                <span className="text-xs text-gray-300">{b.label}</span>
              </div>
            ))}
          </div>

          <MapContainer
            center={[1.3521, 103.8198]}
            zoom={11}
            style={{ height: 'calc(100vh - 110px)', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png"
              attribution='<a href="https://www.onemap.gov.sg/" target="_blank">OneMap</a> &copy; Singapore Land Authority'
              minZoom={11}
              maxZoom={19}
            />

            {districts.map((d) => {
              const radius = Math.max(8, Math.min(28, d.psf_median / 100))
              return (
                <CircleMarker
                  key={d.code}
                  center={[d.lat, d.lng]}
                  radius={radius}
                  pathOptions={{
                    fillColor: psfColor(d.psf_median),
                    fillOpacity: 0.75,
                    color: '#1f2937',
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <p style={{ fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                        {d.code} — {d.name}
                      </p>
                      <p style={{ color: '#374151', fontSize: 13 }}>
                        PSF Median: <strong>{formatSgd(d.psf_median)}</strong>
                      </p>
                      <p style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>
                        {d.transaction_count > 0
                          ? `Based on ${d.transaction_count} transactions`
                          : 'Seeded estimate'}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}

            {visibleAmenities.map((a, i) => (
              <Marker key={`${a.type}-${i}`} position={[a.lat, a.lng]} icon={amenityIcon(a.type)}>
                <Popup>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#111827' }}>{a.name}</p>
                    {a.subtype && (
                      <p style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{a.subtype}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  )
}
