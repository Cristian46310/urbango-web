import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

export interface MapStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  location?: string;
}

interface RouteMapProps {
  stops: MapStop[];
  className?: string;
  heightClassName?: string;
}

const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function RouteMap({
  stops,
  className = '',
  heightClassName = 'h-80',
}: RouteMapProps) {
  if (stops.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/30 ${heightClassName} ${className}`}>
        <p className="text-sm text-muted-foreground">Sin paraderos para mostrar en el mapa</p>
      </div>
    );
  }

  const sorted = [...stops].sort((a, b) => a.order - b.order);
  const center: [number, number] = [sorted[0].latitude, sorted[0].longitude];
  const positions: [number, number][] = sorted.map((s) => [s.latitude, s.longitude]);

  return (
    <div className={`overflow-hidden rounded-lg border ${heightClassName} ${className}`}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length > 1 ? (
          <Polyline positions={positions} color="#2563eb" weight={4} opacity={0.7} />
        ) : null}
        {sorted.map((stop) => (
          <Marker
            key={`${stop.id}-${String(stop.order)}`}
            position={[stop.latitude, stop.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>
                {stop.order}. {stop.name}
              </strong>
              {stop.location ? <p className="text-xs mt-1">{stop.location}</p> : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
