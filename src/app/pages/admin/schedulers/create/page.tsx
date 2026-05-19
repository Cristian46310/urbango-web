import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRoutes } from "@/services/routeService";
import type { RouteListItem } from "@/services/routeService";
import { getBuses } from "@/services/busService";
import type { BusItem } from "@/services/busService";
import { createScheduler } from "@/services/schedulerService";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

export default function AdminSchedulerCreatePage() {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [toleranceMinutes, setToleranceMinutes] = useState("0");
  const [recurrenceType, setRecurrenceType] = useState("none");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getRoutes().then(setRoutes).catch((error) => {
      showErrorToast(`No se pudieron cargar rutas: ${(error as Error).message}`);
    });
    void getBuses().then(setBuses).catch((error) => {
      showErrorToast(`No se pudieron cargar buses: ${(error as Error).message}`);
    });
  }, []);

  const handleSubmit = async () => {
    if (!routeId || !busId || !date || !startTime || !endTime) {
      showErrorToast("Completa todos los campos requeridos.");
      return;
    }

    try {
      setLoading(true);
      await createScheduler({
        routeId,
        busId,
        date,
        startTime,
        endTime,
        toleranceMinutes: Number(toleranceMinutes),
        recurrenceType: recurrenceType as "none" | "weekdays" | "weekends" | "daily",
      });
      showSuccessToast("Programación creada correctamente.");
      setRouteId("");
      setBusId("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setToleranceMinutes("0");
      setRecurrenceType("none");
    } catch (error) {
      showErrorToast(`Error al crear la programación: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-(--security-foreground)">Crear programación de bus</h1>
        <p className="mt-2 text-sm text-(--security-muted-foreground)">Programa rutas, buses y recurrencia para los horarios.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="route-select">Ruta</Label>
              <Select value={routeId} onValueChange={setRouteId}>
                <SelectTrigger id="route-select">
                  <SelectValue placeholder="Seleccionar ruta" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bus-select">Bus</Label>
              <Select value={busId} onValueChange={setBusId}>
                <SelectTrigger id="bus-select">
                  <SelectValue placeholder="Seleccionar bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map((bus) => (
                    <SelectItem key={bus.id} value={bus.id}>{bus.placa} - {bus.capacidad} pax</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Hora inicio</Label>
              <Input id="start-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">Hora fin</Label>
              <Input id="end-time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tolerance-minutes">Tolerancia (min)</Label>
              <Input id="tolerance-minutes" type="number" min="0" value={toleranceMinutes} onChange={(event) => setToleranceMinutes(event.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recurrence-type">Recurrencia</Label>
              <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                <SelectTrigger id="recurrence-type">
                  <SelectValue placeholder="Seleccionar recurrencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  <SelectItem value="weekdays">Días de semana</SelectItem>
                  <SelectItem value="weekends">Fines de semana</SelectItem>
                  <SelectItem value="daily">Diario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6">
              <Button type="button" onClick={handleSubmit} disabled={loading} className="w-full">
                Crear programación
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
