import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/app/components/security/page-shell";
import { startTurn, updateBusGps } from "@/services/turnService";
import type { StartTurnResponse } from "@/services/turnService";
import { personRepository } from "@/infra/repository/person";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { useGeolocation } from "@/hooks/useGeolocation";

const BUS_STATUS_OPTIONS = [
  { value: "operativo", label: "Operativo" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "con observaciones", label: "Con observaciones" },
];

const GPS_INTERVAL_MS = 30_000;

export default function DriverTurnStartPage() {
  const [busStatus, setBusStatus] = useState(BUS_STATUS_OPTIONS[0].value);
  const [observations, setObservations] = useState("");
  const [response, setResponse] = useState<StartTurnResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [driverName, setDriverName] = useState<string | null>(null);
  const geolocation = useGeolocation();
  const gpsIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    void personRepository.getMyProfile("driver").then((profile) => {
      if (profile?.name) {
        setDriverName(profile.name);
      }
    });
    void geolocation.requestPermission();
  }, []);

  useEffect(() => {
    const busId = response?.bus?.id;
    if (!busId || response?.status !== "in_progress") {
      return;
    }

    const sendGps = () => {
      if (geolocation.latitude == null || geolocation.longitude == null) {
        return;
      }
      void updateBusGps(busId, geolocation.latitude, geolocation.longitude).catch(() => {
        /* silent retry on next tick */
      });
    };

    sendGps();
    gpsIntervalRef.current = window.setInterval(sendGps, GPS_INTERVAL_MS);

    return () => {
      if (gpsIntervalRef.current != null) {
        window.clearInterval(gpsIntervalRef.current);
      }
    };
  }, [response, geolocation.latitude, geolocation.longitude]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const result = await startTurn({
        busStatus,
        observations: observations.trim() || undefined,
        ...(geolocation.latitude != null && geolocation.longitude != null
          ? { latitude: geolocation.latitude, longitude: geolocation.longitude }
          : {}),
      });
      setResponse(result);
      showSuccessToast(result.message ?? "Turno iniciado correctamente.");
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Error iniciando turno"));
    } finally {
      setLoading(false);
    }
  };

  const busLabel =
    response?.bus?.placa ??
    response?.bus?.plate ??
    "—";

  return (
    <PageShell
      title="Inicio de turno"
      description={
        driverName
          ? `Conductor: ${driverName}. Confirma el estado del bus asignado.`
          : "Confirma el estado del bus y arranca el turno."
      }
    >
      <div className="max-w-2xl space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bus-status">Estado del bus</Label>
          <Input
            id="bus-status"
            value={busStatus}
            onChange={(event) => setBusStatus(event.target.value)}
            list="bus-status-options"
          />
          <datalist id="bus-status-options">
            {BUS_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observations">Observaciones</Label>
          <Textarea
            id="observations"
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
            className="min-h-24"
            placeholder="Opcional"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          GPS: {geolocation.latitude ?? "n/a"}, {geolocation.longitude ?? "n/a"}
        </p>

        <Button type="button" onClick={() => void handleSubmit()} disabled={loading}>
          {loading ? "Iniciando..." : "Iniciar turno"}
        </Button>
      </div>

      {response ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-3xl">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Bus</p>
            <p className="mt-1 font-semibold">{busLabel}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Inicio real</p>
            <p className="mt-1 font-semibold">
              {new Date(response.startTime).toLocaleString("es-CO")}
            </p>
          </div>
          {response.scheduledStartTime ? (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Hora programada</p>
              <p className="mt-1 font-semibold">
                {new Date(response.scheduledStartTime).toLocaleString("es-CO")}
              </p>
            </div>
          ) : null}
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Estado</p>
            <p className="mt-1 font-semibold">{response.status}</p>
          </div>
        </div>
      ) : null}

      {response?.status === "in_progress" ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Enviando posición GPS cada {GPS_INTERVAL_MS / 1000}s al bus asignado.
        </p>
      ) : null}
    </PageShell>
  );
}
