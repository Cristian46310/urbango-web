import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { TextField } from "@/app/components/business/form-fields";
import { useStopAdmin } from "@/hooks/business";
import {
  STOP_TYPE_LABELS,
  STOP_TYPE_OPTIONS,
  type Stop,
  type StopType,
} from "@/core/domain/entities/business";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Imports de Leaflet para el mapa interactivo
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para los íconos de Leaflet en Vite/Next
const DefaultIcon = L.icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Estilo para forzar que el mapa herede el border-radius del contenedor
const mapContainerStyle = {
  height: "100%",
  width: "100%",
  borderRadius: "inherit",
};

interface StopForm {
  id: string;
  name: string;
  location: string;
  latitude: string;
  longitude: string;
  type: StopType;
}

const initialForm: StopForm = {
  id: "",
  name: "",
  location: "",
  latitude: "5.0689",
  longitude: "-75.5174",
  type: "regular",
};

/** Compatibilidad con valores antiguos del formulario antes del alineamiento con OpenAPI */
const LEGACY_STOP_TYPE: Record<string, StopType> = {
  BASICO: "regular",
  ESTACION: "intermediate",
  TERMINAL: "terminal",
};

function normalizeStopType(value: string | undefined): StopType {
  if (!value) return "regular";
  if (value in LEGACY_STOP_TYPE) return LEGACY_STOP_TYPE[value];
  if (STOP_TYPE_OPTIONS.includes(value as StopType)) return value as StopType;
  return "regular";
}

const columnHelper = createColumnHelper<Stop>();

function toPayload(form: StopForm) {
  return {
    name: form.name.trim(),
    location: form.location.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    type: form.type,
  };
}

// Componente auxiliar para capturar clics en el mapa
function MapClickHandler({
  onChange,
  disabled,
}: {
  onChange: (lat: number, lng: number) => void;
  disabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function StopsAdminPage() {
  const crud = useStopAdmin();

  return (
    <BusinessCrudPage
      title="Paradas"
      description="Administra paradas del sistema de transporte."
      tableTitle="Listado de paradas"
      tableDescription="Paradas registradas."
      entityLabel="parada"
      filterField="name"
      filterPlaceholder="Buscar por nombre"
      items={crud.items}
      page={crud.page}
      loading={crud.loading}
      error={crud.error}
      loadItems={crud.loadItems}
      addItem={crud.addItem}
      editItem={crud.editItem}
      removeItem={crud.removeItem}
      initialForm={initialForm}
      mapToForm={(e: any) => ({
        id: e.id,
        name: e.name,
        location: e.location,
        latitude: String(e.latitude),
        longitude: String(e.longitude),
        type: normalizeStopType(e.type),
      })}
      getId={(f) => f.id}
      buildCreatePayload={toPayload}
      buildUpdatePayload={toPayload}
      columns={[
        columnHelper.accessor("name", { header: "Nombre" }),
        columnHelper.accessor("location", { header: "Ubicación" }),
        columnHelper.accessor("latitude", { header: "Lat" }),
        columnHelper.accessor("longitude", { header: "Lon" }),
        columnHelper.accessor("type", {
          header: "Tipo",
          cell: (info) => {
            const t = info.getValue();
            return t ? (STOP_TYPE_LABELS[t as StopType] ?? t) : "—";
          },
        }),
      ]}
      renderForm={(form, setForm, mode) => {
        const lat = Number(form.latitude) || 5.0689;
        const lng = Number(form.longitude) || -75.5174;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-[320px] md:min-w-[700px]">
            {/* Lado izquierdo: Formulario de datos */}
            <div className="space-y-4">
              <TextField
                id="name"
                label="Nombre del Paradero"
                value={form.name}
                onChange={(v) => {
                  setForm((c) => ({ ...c, name: v }));
                }}
                disabled={mode === "view"}
              />
              <TextField
                id="location"
                label="Descripción / Ubicación de referencia"
                value={form.location}
                onChange={(v) => {
                  setForm((c) => ({ ...c, location: v }));
                }}
                disabled={mode === "view"}
              />

              {/* Selector de Tipo de paradero */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Tipo de Paradero
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((c) => ({ ...c, type: v }))}
                  disabled={mode === "view"}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {STOP_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {STOP_TYPE_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <TextField
                  id="latitude"
                  label="Latitud GPS"
                  value={form.latitude}
                  onChange={(v) => {
                    setForm((c) => ({ ...c, latitude: v }));
                  }}
                  disabled={mode === "view"}
                  type="number"
                />
                <TextField
                  id="longitude"
                  label="Longitud GPS"
                  value={form.longitude}
                  onChange={(v) => {
                    setForm((c) => ({ ...c, longitude: v }));
                  }}
                  disabled={mode === "view"}
                  type="number"
                />
              </div>
              {mode !== "view" && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  Tip: Puedes hacer clic directamente en el mapa de la derecha para capturar las coordenadas exactas.
                </p>
              )}
            </div>

            {/* Lado derecho: Mapa interactivo - AHORA BIEN CONTENIDO */}
            <div
              className="w-full rounded-lg border shadow-sm overflow-hidden"
              style={{ height: "320px" }} /* Altura fija y predecible */
            >
              <MapContainer
                center={[lat, lng]}
                zoom={14}
                style={mapContainerStyle}
                zoomControl={true}
                attributionControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler
                  disabled={mode === "view"}
                  onChange={(newLat, newLng) => {
                    setForm((c) => ({
                      ...c,
                      latitude: String(newLat.toFixed(6)),
                      longitude: String(newLng.toFixed(6)),
                    }));
                  }}
                />
                <Marker position={[lat, lng]} />
              </MapContainer>
            </div>
          </div>
        );
      }}
    />
  );
}