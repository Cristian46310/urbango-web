import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createRoute, type CreateRoutePayload } from "@/services/routeService";
import { getStops, type StopItem } from "@/services/stopService";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";

type SelectedNode = {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  order: number;
  distanceFromPrevious: number;
  estimatedTimeMinutes: number;
};

const DEFAULT_CENTER: [number, number] = [4.7109886, -74.072092];

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

function recomputeNodeMetrics(nodes: SelectedNode[]) {
  return nodes.map((node, index) => ({
    ...node,
    order: index + 1,
    distanceFromPrevious:
      index === 0 ? 0 : Math.round(haversine(nodes[index - 1].lat, nodes[index - 1].lng, node.lat, node.lng)),
  }));
}

const iconDefaultPrototype = L.Icon.Default.prototype as L.Icon.Default & {
  _getIconUrl?: () => string;
};

delete iconDefaultPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
});

export default function AdminRouteCreatePage() {
  const [stops, setStops] = useState<StopItem[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState("");
  const [nodes, setNodes] = useState<SelectedNode[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStops() {
      setLoadingStops(true);
      try {
        const loadedStops = await getStops();
        if (isMounted) {
          setStops(loadedStops);
        }
      } catch {
        if (isMounted) {
          setError("No se pudieron cargar los paraderos disponibles.");
        }
      } finally {
        if (isMounted) {
          setLoadingStops(false);
        }
      }
    }

    void loadStops();

    return () => {
      isMounted = false;
    };
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (nodes.length > 0) {
      return [nodes[0].lat, nodes[0].lng];
    }

    if (stops.length > 0) {
      return [stops[0].lat, stops[0].lng];
    }

    return DEFAULT_CENTER;
  }, [nodes, stops]);

  const addStop = () => {
    if (!selectedStopId) {
      return;
    }

    if (nodes.some((node) => node.stopId === selectedStopId)) {
      setError("Ese paradero ya fue agregado al recorrido.");
      return;
    }

    const stop = stops.find((item) => item.id === selectedStopId);
    if (!stop) {
      setError("El paradero seleccionado no existe.");
      return;
    }

    const distanceFromPrevious = nodes.length === 0 ? 0 : Math.round(haversine(nodes[nodes.length - 1].lat, nodes[nodes.length - 1].lng, stop.lat, stop.lng));

    setNodes((current) => [
      ...current,
      {
        stopId: stop.id,
        stopName: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        order: current.length + 1,
        distanceFromPrevious,
        estimatedTimeMinutes: 5,
      },
    ]);
    setSelectedStopId("");
    setError(null);
  };

  const updateEstimatedTime = (index: number, value: number) => {
    setNodes((current) =>
      current.map((node, currentIndex) =>
        currentIndex === index
          ? {
              ...node,
              estimatedTimeMinutes: Number.isNaN(value) ? 0 : Math.max(0, value),
            }
          : node,
      ),
    );
  };

  const removeNode = (index: number) => {
    setNodes((current) => recomputeNodeMetrics(current.filter((_, currentIndex) => currentIndex !== index)));
  };

  const moveUp = (index: number) => {
    if (index === 0) {
      return;
    }

    setNodes((current) => {
      const next = [...current];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return recomputeNodeMetrics(next);
    });
  };

  const moveDown = (index: number) => {
    if (index >= nodes.length - 1) {
      return;
    }

    setNodes((current) => {
      const next = [...current];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return recomputeNodeMetrics(next);
    });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setNodes([]);
    setSelectedStopId("");
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre de la ruta es obligatorio.");
      return;
    }

    if (price === "" || Number(price) < 0) {
      setError("Ingresa un precio válido.");
      return;
    }

    if (nodes.length < 3) {
      setError("La ruta debe contener al menos 3 paraderos.");
      return;
    }

    const payload: CreateRoutePayload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      nodes: nodes.map((node) => ({
        order: node.order,
        stopId: node.stopId,
        distanceFromPrevious: node.distanceFromPrevious,
        estimatedTimeMinutes: node.estimatedTimeMinutes,
      })),
    };

    const toastId = showLoadingToast("Creando ruta...");
    setSubmitting(true);

    try {
      await createRoute(payload);
      showSuccessToast("Ruta creada correctamente");
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la ruta.";
      setError(message);
      showErrorToast(message);
    } finally {
      setSubmitting(false);
      dismissToast(toastId);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Administración</p>
        <h1 className="text-2xl font-semibold tracking-tight">Crear nueva ruta</h1>
        <p className="text-sm text-muted-foreground">
          Organiza los paraderos en orden, ajusta el tiempo estimado y revisa el recorrido en el mapa.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="route-name">Nombre</Label>
              <Input
                id="route-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ruta 101"
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
                onChange={(event) => setPrice(event.target.value === "" ? "" : Number(event.target.value))}
                placeholder="10000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-description">Descripción</Label>
            <Textarea
              id="route-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ruta principal hacia el centro"
              rows={4}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label>Agregar paradero</Label>
              <Select value={selectedStopId} onValueChange={setSelectedStopId} disabled={loadingStops || stops.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingStops ? "Cargando..." : "Selecciona un paradero"} />
                </SelectTrigger>
                <SelectContent>
                  {stops.map((stop) => (
                    <SelectItem key={stop.id} value={stop.id}>
                      {stop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="button" onClick={addStop} disabled={!selectedStopId || loadingStops}>
              Añadir al recorrido
            </Button>
          </div>

          {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Paraderos del recorrido</Label>
              <span className="text-sm text-muted-foreground">{nodes.length} seleccionados</span>
            </div>

            <div className="space-y-2">
              {nodes.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Aún no has agregado paraderos. Selecciona uno para comenzar.
                </div>
              ) : (
                nodes.map((node, index) => (
                  <div key={node.stopId} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{node.stopName}</p>
                        <p className="text-sm text-muted-foreground">Orden: {node.order}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => moveUp(index)} disabled={index === 0}>
                          Subir
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => moveDown(index)} disabled={index === nodes.length - 1}>
                          Bajar
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeNode(index)}>
                          Quitar
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Tiempo estimado (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={node.estimatedTimeMinutes}
                          onChange={(event) => updateEstimatedTime(index, Number(event.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Distancia desde el anterior</Label>
                        <Input value={`${node.distanceFromPrevious} m`} readOnly />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar ruta"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Limpiar formulario
            </Button>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Vista del recorrido</h2>
              <p className="text-sm text-muted-foreground">
                El mapa muestra el orden actual de los paraderos seleccionados.
              </p>
            </div>

            <div className="h-[520px] overflow-hidden rounded-lg border">
              <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {nodes.map((node) => (
                  <Marker key={node.stopId} position={[node.lat, node.lng]}>
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-semibold">{node.stopName}</p>
                        <p className="text-sm">Orden: {node.order}</p>
                        <p className="text-sm">Tiempo estimado: {node.estimatedTimeMinutes} min</p>
                        <p className="text-sm">Distancia: {node.distanceFromPrevious} m</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {nodes.length >= 2 ? (
                  <Polyline positions={nodes.map((node) => [node.lat, node.lng] as [number, number])} color="#2563eb" weight={4} />
                ) : null}
              </MapContainer>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
