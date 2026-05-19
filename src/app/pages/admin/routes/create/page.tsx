import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { MapPicker } from "@/components/MapPicker";
import { getStops, StopItem } from "@/services/stopService";
import { createRoute, RouteNodePayload } from "@/services/routeService";

interface SelectedStop extends StopItem {
  order: number;
  distanceFromPrevious: number;
  estimatedTimeMinutes: number;
}

export default function AdminRouteCreatePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stops, setStops] = useState<StopItem[]>([]);
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getStops()
      .then(setStops)
      .catch((error) => {
        showErrorToast(`No se pudieron obtener los paraderos: ${(error as Error).message}`);
      });
  }, []);

  const selectedStopIds = useMemo(() => selectedStops.map((stop) => stop.id), [selectedStops]);

  const handleAddStop = (stop: StopItem) => {
    if (selectedStopIds.includes(stop.id)) {
      showErrorToast("Este paradero ya está agregado.");
      return;
    }

    setSelectedStops((current) => [
      ...current,
      {
        ...stop,
        order: current.length + 1,
        distanceFromPrevious: current.length === 0 ? 0 : 0,
        estimatedTimeMinutes: 0,
      },
    ]);
  };

  const handleRemoveStop = (stopId: string) => {
    setSelectedStops((current) => current.filter((item) => item.id !== stopId).map((item, index) => ({ ...item, order: index + 1 })));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !price.trim()) {
      showErrorToast("Completa nombre, descripción y tarifa.");
      return;
    }

    if (selectedStops.length < 3) {
      showErrorToast("Debes agregar al menos 3 paraderos.");
      return;
    }

    const nodes: RouteNodePayload[] = selectedStops.map((stop, index) => ({
      stopId: stop.id,
      order: index + 1,
      distanceFromPrevious: Number(stop.distanceFromPrevious),
      estimatedTimeMinutes: Number(stop.estimatedTimeMinutes),
    }));

    try {
      setLoading(true);
      await createRoute({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        nodes,
      });
      showSuccessToast("Ruta creada correctamente.");
      setName("");
      setDescription("");
      setPrice("");
      setSelectedStops([]);
    } catch (error) {
      showErrorToast(`Error creando ruta: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-(--security-foreground)">Crear nueva ruta</h1>
        <p className="mt-2 text-sm text-(--security-muted-foreground)">Define la ruta y los paraderos sobre el mapa.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="route-name">Nombre</Label>
                <Input id="route-name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="route-price">Tarifa</Label>
                <Input id="route-price" type="number" step="0.01" min="0" value={price} onChange={(event) => setPrice(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="route-description">Descripción</Label>
              <textarea
                id="route-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="block w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
                style={{ minHeight: 120 }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-4">
              <p className="text-sm font-semibold text-(--security-foreground)">Paraderos seleccionados</p>
              <p className="mt-2 text-sm text-(--security-muted-foreground)">Haz clic en un marcador para agregarlos al recorrido.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapPicker stops={stops} selectedStopIds={selectedStopIds} onSelectStop={handleAddStop} />
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-(--security-foreground)">Lista de paraderos</h2>
            {selectedStops.length === 0 ? (
              <p className="mt-4 text-sm text-(--security-muted-foreground)">No hay paraderos seleccionados.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {selectedStops.map((selected) => (
                  <div key={selected.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{selected.order}. {selected.name}</p>
                        <p className="text-sm text-slate-600">ID: {selected.id}</p>
                      </div>
                      <Button variant="ghost" size="sm" type="button" onClick={() => handleRemoveStop(selected.id)}>
                        Eliminar
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`distance-${selected.id}`}>Distancia desde anterior (km)</Label>
                        <Input
                          id={`distance-${selected.id}`}
                          type="number"
                          step="0.1"
                          min="0"
                          value={selected.distanceFromPrevious}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setSelectedStops((current) => current.map((stop) => stop.id === selected.id ? { ...stop, distanceFromPrevious: value } : stop));
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`time-${selected.id}`}>Tiempo estimado (min)</Label>
                        <Input
                          id={`time-${selected.id}`}
                          type="number"
                          step="1"
                          min="0"
                          value={selected.estimatedTimeMinutes}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setSelectedStops((current) => current.map((stop) => stop.id === selected.id ? { ...stop, estimatedTimeMinutes: value } : stop));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="button" onClick={handleSubmit} disabled={loading} className="w-full">
            Crear ruta
          </Button>
        </div>
      </section>
    </main>
  );
}
