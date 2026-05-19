import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { MouseEvent as LeafletMouseEvent } from "leaflet";
import type { StopItem } from "@/services/stopService";

import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface MapPickerProps {
  stops: StopItem[];
  selectedStopIds: string[];
  onSelectStop: (stop: StopItem) => void;
}

export function MapPicker({ stops, selectedStopIds, onSelectStop }: MapPickerProps) {
  const center = useMemo(() => {
    if (stops.length === 0) {
      return [4.676, -75.555] as [number, number];
    }
    const first = stops[0];
    return [first.lat, first.lng] as [number, number];
  }, [stops]);

  return (
    <div className="rounded-xl border border-(--security-border) bg-(--security-surface) p-2">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-90 w-full rounded-lg">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stops.map((stop) => {
          return (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              eventHandlers={{
                click: () => {
                  onSelectStop(stop);
                },
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <strong>{stop.name}</strong>
                  <p className="text-xs text-slate-600">Lat: {stop.lat.toFixed(5)}, Lng: {stop.lng.toFixed(5)}</p>
                  <p className="text-xs">Seleccionar para agregar al recorrido.</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <p className="mt-3 text-sm text-(--security-muted-foreground)">Haz clic en un marcador para añadir ese paradero al recorrido.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {selectedStopIds.map((stopId) => (
          <span key={stopId} className="rounded-full border border-(--security-border) px-3 py-1 text-sm text-(--security-foreground)">
            {stopId}
          </span>
        ))}
      </div>
    </div>
  );
}
