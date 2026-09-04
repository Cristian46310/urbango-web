import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getStops, type StopItem } from "@/services/stopService";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRoadPolyline } from "@/hooks/useRoadPolyline";
import type { LatLngTuple } from "@/services/osrmRouteService";

export type RouteDesignerNode = {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  order: number;
  distanceFromPrevious: number;
  estimatedTimeMinutes: number;
};

export type RouteDesignerValues = {
  name: string;
  description: string;
  price: number | "";
  nodes: RouteDesignerNode[];
};

export type RouteDesignerMode = "create" | "edit" | "view";

/** Fallback solo si no hay GPS ni nodos (Bogotá). */
const DEFAULT_CENTER: [number, number] = [4.7109886, -74.072092];

function MapCenter({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    // Avoid animated setView: zoom transitions can finish after unmount and
    // throw "Cannot read properties of undefined (reading '_leaflet_pos')".
    if (!map.getContainer()?.isConnected) return;

    try {
      map.stop();
      map.setView(center, zoom, { animate: false });
    } catch {
      // Map may already be tearing down (Strict Mode / route remount).
    }

    return () => {
      try {
        map.stop();
      } catch {
        // ignore
      }
    };
  }, [center, map, zoom]);
  return null;
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function recomputeNodeMetrics(nodes: RouteDesignerNode[]) {
  return nodes.map((node, index) => ({
    ...node,
    order: index + 1,
    distanceFromPrevious:
      index === 0
        ? 0
        : Math.round(
            haversine(
              nodes[index - 1].lat,
              nodes[index - 1].lng,
              node.lat,
              node.lng,
            ),
          ),
    estimatedTimeMinutes:
      index === 0 ? 0 : node.estimatedTimeMinutes,
  }));
}

const iconDefaultPrototype = L.Icon.Default.prototype as L.Icon.Default & {
  _getIconUrl?: () => string;
};
delete iconDefaultPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).toString(),
  iconUrl: new URL(
    "leaflet/dist/images/marker-icon.png",
    import.meta.url,
  ).toString(),
  shadowUrl: new URL(
    "leaflet/dist/images/marker-shadow.png",
    import.meta.url,
  ).toString(),
});

type RouteMapDesignerProps = {
  mode: RouteDesignerMode;
  initialValues?: Partial<RouteDesignerValues>;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: RouteDesignerValues) => Promise<void> | void;
};

export function RouteMapDesigner({
  mode,
  initialValues,
  submitting = false,
  onCancel,
  onSubmit,
}: RouteMapDesignerProps) {
  const readOnly = mode === "view";
  const nodesEditable = mode === "create";
  const geolocation = useGeolocation();

  const [stops, setStops] = useState<StopItem[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState("");
  const [nodes, setNodes] = useState<RouteDesignerNode[]>(
    initialValues?.nodes ?? [],
  );
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [price, setPrice] = useState<number | "">(initialValues?.price ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void geolocation.requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pedir GPS una vez al montar
  }, []);

  useEffect(() => {
    setName(initialValues?.name ?? "");
    setDescription(initialValues?.description ?? "");
    setPrice(initialValues?.price ?? "");
    setNodes(initialValues?.nodes ?? []);
    setError(null);
  }, [initialValues]);

  useEffect(() => {
    let isMounted = true;
    async function loadStops() {
      setLoadingStops(true);
      try {
        const loadedStops = await getStops();
        if (isMounted) setStops(loadedStops);
      } catch {
        if (isMounted) {
          setError("No se pudieron cargar los paraderos disponibles.");
        }
      } finally {
        if (isMounted) setLoadingStops(false);
      }
    }
    void loadStops();
    return () => {
      isMounted = false;
    };
  }, []);

  const userCenter = useMemo<[number, number] | null>(() => {
    if (geolocation.latitude != null && geolocation.longitude != null) {
      return [geolocation.latitude, geolocation.longitude];
    }
    return null;
  }, [geolocation.latitude, geolocation.longitude]);

  const center = useMemo<[number, number]>(() => {
    // 1) Si ya hay recorrido, seguir el primer nodo
    if (nodes.length > 0) return [nodes[0].lat, nodes[0].lng];
    // 2) Al crear/editar sin nodos: GPS del navegador (p. ej. Manizales)
    if (userCenter) return userCenter;
    // 3) Fallback
    return DEFAULT_CENTER;
  }, [nodes, userCenter]);

  const mapZoom = nodes.length > 0 ? 13 : userCenter ? 14 : 12;

  const nodeWaypoints = useMemo<LatLngTuple[]>(
    () =>
      nodes
        .map((node) => {
          const lat = Number(node.lat);
          const lng = Number(node.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return [lat, lng] as LatLngTuple;
        })
        .filter((point): point is LatLngTuple => point != null),
    [nodes],
  );
  const {
    positions: routePositions,
    usedRoads,
    loading: routingLoading,
  } = useRoadPolyline(nodeWaypoints);

  const stopsForSelect = useMemo(() => {
    if (!userCenter) return stops;
    return [...stops].sort((a, b) => {
      const da = haversine(userCenter[0], userCenter[1], a.lat, a.lng);
      const db = haversine(userCenter[0], userCenter[1], b.lat, b.lng);
      return da - db;
    });
  }, [stops, userCenter]);

  const addStop = () => {
    if (!selectedStopId) return;
    if (nodes.some((node) => node.stopId === selectedStopId)) {
      setError("Ese paradero ya fue agregado al recorrido.");
      return;
    }
    const stop = stops.find((item) => item.id === selectedStopId);
    if (!stop) {
      setError("El paradero seleccionado no existe.");
      return;
    }
    const distanceFromPrevious =
      nodes.length === 0
        ? 0
        : Math.round(
            haversine(
              nodes[nodes.length - 1].lat,
              nodes[nodes.length - 1].lng,
              stop.lat,
              stop.lng,
            ),
          );
    setNodes((current) =>
      recomputeNodeMetrics([
        ...current,
        {
          stopId: stop.id,
          stopName: stop.name,
          lat: stop.lat,
          lng: stop.lng,
          order: current.length + 1,
          distanceFromPrevious,
          estimatedTimeMinutes: current.length === 0 ? 0 : 5,
        },
      ]),
    );
    setSelectedStopId("");
    setError(null);
  };

  const updateEstimatedTime = (index: number, value: number) => {
    if (index === 0) return;
    setNodes((current) =>
      current.map((node, currentIndex) =>
        currentIndex === index
          ? {
              ...node,
              estimatedTimeMinutes: Number.isNaN(value)
                ? 0
                : Math.max(0, value),
            }
          : node,
      ),
    );
  };

  const removeNode = (index: number) => {
    setNodes((current) =>
      recomputeNodeMetrics(
        current.filter((_, currentIndex) => currentIndex !== index),
      ),
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setNodes((current) => {
      const next = [...current];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return recomputeNodeMetrics(next);
    });
  };

  const moveDown = (index: number) => {
    if (index >= nodes.length - 1) return;
    setNodes((current) => {
      const next = [...current];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return recomputeNodeMetrics(next);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) return;
    setError(null);

    if (!name.trim()) {
      setError("El nombre de la ruta es obligatorio.");
      return;
    }
    if (price === "" || Number(price) < 0) {
      setError("Ingresa un precio válido.");
      return;
    }
    if (mode === "create" && nodes.length < 3) {
      setError("La ruta debe contener al menos 3 paraderos.");
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      nodes: recomputeNodeMetrics(nodes),
    });
  };

  const title =
    mode === "create"
      ? "Crear ruta"
      : mode === "edit"
        ? "Editar ruta"
        : "Detalle de ruta";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {nodesEditable
              ? "Organiza los paraderos en orden y revisa el recorrido en el mapa."
              : "Consulta el recorrido en el mapa. En edición solo puedes cambiar datos básicos."}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onCancel}>
          Volver al listado
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <Card className="space-y-4 border-(--security-border) p-4 md:p-6 lg:col-span-2">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="route-name">Nombre</Label>
              <Input
                id="route-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                placeholder="Ruta 101"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="route-price">Precio</Label>
              <Input
                id="route-price"
                type="number"
                min={0}
                step={1}
                value={price}
                onChange={(event) => {
                  setPrice(
                    event.target.value === ""
                      ? ""
                      : Number(event.target.value),
                  );
                }}
                placeholder="10000"
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-description">Descripción</Label>
            <Textarea
              id="route-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
              }}
              placeholder="Ruta principal hacia el centro"
              rows={4}
              disabled={readOnly}
            />
          </div>

          {nodesEditable ? (
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label>Agregar paradero</Label>
                <Select
                  value={selectedStopId}
                  onValueChange={setSelectedStopId}
                  disabled={loadingStops || stops.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingStops ? "Cargando..." : "Selecciona un paradero"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {stopsForSelect.map((stop) => (
                      <SelectItem key={stop.id} value={stop.id}>
                        {stop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={addStop}
                disabled={!selectedStopId || loadingStops}
              >
                Añadir al recorrido
              </Button>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Paraderos del recorrido</Label>
              <span className="text-sm text-muted-foreground">
                {nodes.length} seleccionados
              </span>
            </div>
            <div className="space-y-2">
              {nodes.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {nodesEditable
                    ? "Aún no has agregado paraderos. Selecciona uno para comenzar."
                    : "Esta ruta no tiene paraderos cargados."}
                </div>
              ) : (
                nodes.map((node, index) => (
                  <div key={node.stopId} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{node.stopName}</p>
                        <p className="text-sm text-muted-foreground">
                          Orden: {node.order}
                        </p>
                      </div>
                      {nodesEditable ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              moveUp(index);
                            }}
                            disabled={index === 0}
                          >
                            Subir
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              moveDown(index);
                            }}
                            disabled={index === nodes.length - 1}
                          >
                            Bajar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              removeNode(index);
                            }}
                          >
                            Quitar
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Tiempo estimado (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={node.estimatedTimeMinutes}
                          onChange={(event) => {
                            updateEstimatedTime(
                              index,
                              Number(event.target.value),
                            );
                          }}
                          disabled={!nodesEditable || index === 0}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Distancia desde el anterior</Label>
                        <Input
                          value={`${String(node.distanceFromPrevious)} m`}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {!readOnly ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Guardando..."
                  : mode === "create"
                    ? "Guardar ruta"
                    : "Actualizar ruta"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          ) : null}
        </Card>

        <Card className="border-(--security-border) p-4 md:p-6 lg:col-span-1 lg:self-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Vista del recorrido</h3>
                <p className="text-sm text-muted-foreground">
                  {userCenter && nodes.length === 0
                    ? "Mapa centrado en tu ubicación actual."
                    : usedRoads
                      ? "Recorrido aproximado por calles (OSRM)."
                      : routingLoading && nodes.length >= 2
                        ? "Calculando recorrido por calles…"
                        : "El mapa muestra el orden actual de los paraderos."}
                </p>
                {geolocation.error && nodes.length === 0 ? (
                  <p className="mt-1 text-xs text-amber-700">
                    No se pudo obtener tu ubicación. Permite GPS o el mapa usará un centro por defecto.
                  </p>
                ) : null}
              </div>
              {nodes.length === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={geolocation.loading}
                  onClick={() => {
                    void geolocation.requestPermission();
                  }}
                >
                  {geolocation.loading ? "Ubicando…" : "Usar mi ubicación"}
                </Button>
              ) : null}
            </div>
            <div className="h-[520px] overflow-hidden rounded-lg border">
              <MapContainer
                center={center}
                zoom={mapZoom}
                scrollWheelZoom
                className="h-full w-full"
              >
                <MapCenter center={center} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {userCenter && nodes.length === 0 ? (
                  <CircleMarker
                    center={userCenter}
                    radius={10}
                    pathOptions={{
                      color: "#0f766e",
                      fillColor: "#14b8a6",
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                  >
                    <Popup>Tu ubicación actual</Popup>
                  </CircleMarker>
                ) : null}
                {nodes.map((node) => (
                  <Marker
                    key={node.stopId}
                    position={[node.lat, node.lng]}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-semibold">{node.stopName}</p>
                        <p className="text-sm">Orden: {node.order}</p>
                        <p className="text-sm">
                          Tiempo estimado: {node.estimatedTimeMinutes} min
                        </p>
                        <p className="text-sm">
                          Distancia: {node.distanceFromPrevious} m
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {routePositions.length >= 2 ? (
                  <Polyline
                    positions={routePositions}
                    color="#0f766e"
                    weight={4}
                    opacity={usedRoads ? 0.9 : 0.65}
                    dashArray={usedRoads ? undefined : "8 10"}
                  />
                ) : null}
              </MapContainer>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
