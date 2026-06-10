import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Stop = {
  id: string;
  name: string;
  location?: string;
  latitude: number;
  longitude: number;
};

type SelectedNode = {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  order: number;
  distanceFromPrev?: number; // metros, sólo UI
  estimatedTimeMinutes: number;
};

const DEFAULT_CENTER: [number, number] = [4.7109886, -74.072092]; // fallback

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // m
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// fix default icon urls (Vite)
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: (L.Icon.Default as any).mergeOptions?.iconRetinaUrl ?? undefined,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
});

export default function Page() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [selectedStopId, setSelectedStopId] = useState<string>("");
  const [nodes, setNodes] = useState<SelectedNode[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStops() {
      setLoadingStops(true);
      try {
        const res = await axios.get<Stop[]>("http://localhost:3000/stop");
        setStops(res.data);
      } catch (e: any) {
        setError("No se pudo cargar paraderos");
      } finally {
        setLoadingStops(false);
      }
    }
    loadStops();
  }, []);

  const addStop = () => {
    if (!selectedStopId) return;
    if (nodes.find((n) => n.stopId === selectedStopId)) return; // sin duplicados

    const stop = stops.find((s) => s.id === selectedStopId);
    if (!stop) return;

    const order = nodes.length + 1;
    const prev = nodes[nodes.length - 1];
    const distanceFromPrev = prev
      ? Math.round(haversine(prev.lat, prev.lng, stop.latitude, stop.longitude))
      : 0;

    setNodes((s) => [
      ...s,
      {
        stopId: stop.id,
        stopName: stop.name,
        lat: stop.latitude,
        lng: stop.longitude,
        order,
        distanceFromPrev,
        estimatedTimeMinutes: 5,
      },
    ]);
    setSelectedStopId("");
  };

  const removeNode = (index: number) => {
    setNodes((curr) => {
      const next = curr.filter((_, i) => i !== index).map((n, i) => ({ ...n, order: i + 1 }));
      // recompute distances
      for (let i = 1; i < next.length; i++) {
        next[i].distanceFromPrev = Math.round(haversine(next[i - 1].lat, next[i - 1].lng, next[i].lat, next[i].lng));
      }
      if (next[0]) next[0].distanceFromPrev = 0;
      return next;
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setNodes((curr) => {
      const next = curr.slice();
      const tmp = next[index - 1];
      next[index - 1] = { ...next[index], order: index };
      next[index] = { ...tmp, order: index + 1 };
      // reassign orders starting from 1
      return next.map((n, i) => ({ ...n, order: i + 1 }));
    });
    // recompute distances after state update
    setTimeout(() => {
      setNodes((curr) =>
        curr.map((n, i) => ({
          ...n,
          distanceFromPrev: i === 0 ? 0 : Math.round(haversine(curr[i - 1].lat, curr[i - 1].lng, n.lat, n.lng)),
        }))
      );
    });
  };

  const moveDown = (index: number) => {
    if (index === nodes.length - 1) return;
    setNodes((curr) => {
      const next = curr.slice();
      const tmp = next[index + 1];
      next[index + 1] = { ...next[index], order: index + 2 };
      next[index] = { ...tmp, order: index + 1 };
      return next.map((n, i) => ({ ...n, order: i + 1 }));
    });
    setTimeout(() => {
      setNodes((curr) =>
        curr.map((n, i) => ({
          ...n,
          distanceFromPrev: i === 0 ? 0 : Math.round(haversine(curr[i - 1].lat, curr[i - 1].lng, n.lat, n.lng)),
        }))
      );
    });
  };

  const updateEstimated = (index: number, value: number) => {
    setNodes((curr) => curr.map((n, i) => (i === index ? { ...n, estimatedTimeMinutes: value } : n)));
  };

  const center: [number, number] = useMemo(() => {
    if (nodes.length > 0) return [nodes[0].lat, nodes[0].lng];
    if (stops.length > 0) return [stops[0].latitude, stops[0].longitude];
    return DEFAULT_CENTER;
  }, [nodes, stops]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    setError(null);
    if (!name.trim()) return setError("El nombre es obligatorio");
    if (price === "" || Number(price) < 0) return setError("Precio inválido");
    if (nodes.length < 3) return setError("Se requieren al menos 3 paraderos ordenados");

    // construir payload conforme al backend (no enviar distanceFromPrev ni stopName)
    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      nodes: nodes.map((n) => ({
        order: n.order,
        stopId: n.stopId,
        estimatedTimeMinutes: n.estimatedTimeMinutes,
      })),
    };

    try {
      setSubmitting(true);
      await axios.post("http://localhost:3000/route", payload);
      // comportamiento post-save: limpiar o navegar
      setName("");
      setDescription("");
      setPrice("");
      setNodes([]);
      alert("Ruta creada correctamente");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al crear ruta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Crear Ruta</h1>

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 col-span-1 lg:col-span-2 space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Tarifa (price)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            <div className="col-span-2">
              <Label>Agregar paradero</Label>
              <Select value={selectedStopId} onValueChange={(v) => setSelectedStopId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar paradero" />
                </SelectTrigger>
                <SelectContent>
                  {loadingStops ? (
                    <div className="p-2">Cargando...</div>
                  ) : (
                    stops.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button type="button" onClick={addStop} className="w-full">
                Añadir
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Label>Paraderos seleccionados</Label>
            <div className="space-y-2 mt-2">
              {nodes.map((n, i) => (
                <div key={n.stopId} className="flex items-center gap-2 p-2 border rounded">
                  <div className="w-1/3">
                    <div className="font-medium">{n.stopName}</div>
                    <div className="text-sm text-muted-foreground">Orden: {n.order}</div>
                  </div>

                  <div className="w-1/4 text-sm">
                    Distancia: {n.distanceFromPrev ?? 0} m
                  </div>

                  <div className="w-1/4">
                    <Label>Tiempo estimado (min)</Label>
                    <Input
                      type="number"
                      value={n.estimatedTimeMinutes}
                      onChange={(e) => updateEstimated(i, Math.max(0, Number(e.target.value)))}
                    />
                  </div>

                  <div className="ml-auto flex gap-1">
                    <Button type="button" onClick={() => moveUp(i)} disabled={i === 0} variant="ghost">
                      ↑
                    </Button>
                    <Button type="button" onClick={() => moveDown(i)} disabled={i === nodes.length - 1} variant="ghost">
                      ↓
                    </Button>
                    <Button type="button" onClick={() => removeNode(i)} variant="destructive">
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
              {nodes.length === 0 && <div className="text-sm text-muted-foreground">No hay paraderos añadidos</div>}
            </div>
          </div>

          {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={submitting}>
              Guardar ruta
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setName(""); setDescription(""); setPrice(""); setNodes([]); }}>
              Limpiar
            </Button>
          </div>
        </Card>

        <Card className="p-4 h-[520px]">
          <div className="h-full">
            <MapContainer center={center} zoom={13} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {nodes.map((n) => (
                <Marker key={n.stopId} position={[n.lat, n.lng]}>
                  <Popup>
                    <div className="font-medium">{n.stopName}</div>
                    <div>Orden: {n.order}</div>
                    <div>ETA: {n.estimatedTimeMinutes} min</div>
                    <div>Dist prev: {n.distanceFromPrev ?? 0} m</div>
                  </Popup>
                </Marker>
              ))}
              {nodes.length >= 2 && (
                <Polyline positions={nodes.map((n) => [n.lat, n.lng] as [number, number])} color="blue" />
              )}
            </MapContainer>
          </div>
        </Card>
      </form>
    </div>
  );
}