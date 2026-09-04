import { useCallback, useEffect, useRef, useState } from "react";
import { Bus, Check, Clock, Loader2, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageShell } from "@/app/components/security/page-shell";
import {
  cacheCurrentTurn,
  endTurn,
  getCurrentTurn,
  startTurn,
  updateTurnGps,
  type CurrentTurn,
} from "@/services/turnService";
import { personRepository } from "@/infra/repository/person";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useGeolocationStore } from "@/store/geolocationStore";
import { cn } from "@/lib/utils";
import {
  clearLastTurnSummary,
  getLastTurnSummary,
} from "@/lib/lastTurnSummary";

const BUS_STATUS_OPTIONS = [
  { value: "operativo", label: "Operativo" },
  { value: "en mantenimiento", label: "En mantenimiento" },
  { value: "fuera de servicio", label: "Fuera de servicio" },
] as const;

const OBSERVATIONS_MAX = 500;
const GPS_INTERVAL_MS = 10_000;

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatTimeOnly(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function summaryToCurrentTurn(): CurrentTurn | null {
  const cached = getLastTurnSummary();
  if (!cached?.turnId) return null;
  const active =
    cached.active === true ||
    cached.status === "in_progress" ||
    cached.status === "active" ||
    cached.status === "en_curso";
  if (!active) return null;
  return {
    id: cached.turnId,
    turnId: cached.turnId,
    busId: cached.busId,
    driverId: cached.driverId,
    status: cached.status,
    active: true,
    startTime: cached.startTime,
    endTime: cached.endTime,
    busPlate: cached.busPlate || undefined,
  };
}

function resolveBusPlate(turn: CurrentTurn | null) {
  if (!turn) return null;
  return turn.busPlate || turn.bus?.plate || turn.bus?.placa || null;
}

export default function DriverTurnStartPage() {
  const [currentTurn, setCurrentTurn] = useState<CurrentTurn | null>(() =>
    summaryToCurrentTurn(),
  );
  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [busStatus, setBusStatus] = useState<string>(BUS_STATUS_OPTIONS[0].value);
  const [observations, setObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [gpsJustUpdated, setGpsJustUpdated] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [endObservations, setEndObservations] = useState("");
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const geolocation = useGeolocation();
  const gpsIntervalRef = useRef<number | null>(null);

  const hasGps = geolocation.latitude != null && geolocation.longitude != null;
  const isActive = Boolean(currentTurn?.active);
  const busPlate = resolveBusPlate(currentTurn);

  const syncTurnFromServer = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const turn = await getCurrentTurn();
      setCurrentTurn(turn.active ? turn : null);
      cacheCurrentTurn(turn);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "No se pudo cargar el turno. Intenta de nuevo.",
      );
      setSyncError(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void syncTurnFromServer();
  }, [syncTurnFromServer]);

  useEffect(() => {
    void personRepository.getMyProfile("driver").then((profile) => {
      if (profile?.name) {
        setDriverName(profile.name);
      }
    });
    void geolocation.requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- request once on mount
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const sendGps = () => {
      if (geolocation.latitude == null || geolocation.longitude == null) {
        return;
      }
      void updateTurnGps(geolocation.latitude, geolocation.longitude).catch(() => {
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
  }, [isActive, geolocation.latitude, geolocation.longitude]);

  const handleRefreshGps = async () => {
    setGpsJustUpdated(false);
    await geolocation.requestPermission();
    const { error, coordinates } = useGeolocationStore.getState();
    if (!error && coordinates) {
      setGpsJustUpdated(true);
      window.setTimeout(() => setGpsJustUpdated(false), 2500);
    }
  };

  const handleObservationsChange = (value: string) => {
    setObservations(value.slice(0, OBSERVATIONS_MAX));
  };

  const handleEndObservationsChange = (value: string) => {
    setEndObservations(value.slice(0, OBSERVATIONS_MAX));
  };

  const openEndDialog = () => {
    setEndError(null);
    setEndObservations("");
    setEndDialogOpen(true);
  };

  const handleEndTurn = async () => {
    if (!currentTurn?.turnId) {
      setEndError("No hay un turno activo para finalizar");
      return;
    }

    setEndError(null);
    setEnding(true);
    try {
      const trimmed = endObservations.trim();
      await endTurn({
        turnId: currentTurn.turnId,
        ...(trimmed ? { observations: trimmed } : {}),
      });
      clearLastTurnSummary();
      setCurrentTurn(null);
      setEndDialogOpen(false);
      setEndObservations("");
      showSuccessToast("Turno finalizado correctamente");
      await syncTurnFromServer();
    } catch (error) {
      const message = getApiErrorMessage(error, "Error finalizando turno");
      setEndError(message);
      showErrorToast(message);
    } finally {
      setEnding(false);
    }
  };

  const handleSubmit = async () => {
    if (isActive) {
      setSubmitError("Ya tienes un turno en curso. Finalízalo antes de iniciar otro.");
      return;
    }

    if (!hasGps) {
      setSubmitError("Esperando ubicación GPS para iniciar turno");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await startTurn({
        busStatus,
        observations: observations.trim() || undefined,
        latitude: geolocation.latitude!,
        longitude: geolocation.longitude!,
      });

      const optimistic: CurrentTurn = {
        id: result.turnId,
        turnId: result.turnId,
        status: result.status || "in_progress",
        active: true,
        startTime: result.startTime,
        scheduledStartTime: result.scheduledStartTime,
        busPlate: result.bus?.placa ?? result.bus?.plate,
        bus: result.bus,
      };
      setCurrentTurn(optimistic);
      cacheCurrentTurn(optimistic);
      showSuccessToast(result.message ?? "Turno iniciado correctamente.");
      await syncTurnFromServer();
    } catch (error) {
      const message = getApiErrorMessage(error, "Error iniciando turno");
      setSubmitError(message);
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (syncing && !currentTurn && !syncError) {
    return (
      <PageShell
        title="Inicio de turno"
        description="Confirma el estado del bus y arranca el turno."
        titleSize="lg"
      >
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-teal-700" />
          <p className="text-sm">Sincronizando turno actual…</p>
        </div>
      </PageShell>
    );
  }

  if (syncError && !currentTurn) {
    return (
      <PageShell
        title="Inicio de turno"
        description="Confirma el estado del bus y arranca el turno."
        titleSize="lg"
      >
        <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm text-red-800" role="alert">
            {syncError}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={syncing}
            onClick={() => void syncTurnFromServer()}
          >
            {syncing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Reintentando…
              </>
            ) : (
              "Reintentar"
            )}
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Inicio de turno"
      description="Confirma el estado del bus y arranca el turno."
      titleSize="lg"
    >
      {syncError ? (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900" role="alert">
            {syncError} Mostrando datos en caché hasta reintentar.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={syncing}
            onClick={() => void syncTurnFromServer()}
          >
            {syncing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Reintentando…
              </>
            ) : (
              "Reintentar"
            )}
          </Button>
        </div>
      ) : null}

      {syncing ? (
        <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Actualizando estado del turno…
        </p>
      ) : null}

      {isActive && currentTurn ? (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-900">Turno en curso</p>
            <p className="text-sm text-emerald-800">
              Desde las {formatTimeOnly(currentTurn.startTime)}
              {busPlate ? ` · Bus ${busPlate}` : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="shrink-0"
            onClick={openEndDialog}
          >
            Finalizar turno
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
        <div className="space-y-4">
          {!isActive ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="bus-status">Estado del bus</Label>
                <Select value={busStatus} onValueChange={setBusStatus}>
                  <SelectTrigger id="bus-status" className="w-full min-w-[300px]">
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUS_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones</Label>
                <div className="relative">
                  <Textarea
                    id="observations"
                    value={observations}
                    onChange={(event) => handleObservationsChange(event.target.value)}
                    className="min-h-24 pb-7"
                    placeholder="Opcional"
                    maxLength={OBSERVATIONS_MAX}
                  />
                  <span
                    className={cn(
                      "pointer-events-none absolute bottom-2 right-3 text-xs tabular-nums",
                      observations.length >= OBSERVATIONS_MAX
                        ? "text-amber-700"
                        : "text-muted-foreground",
                    )}
                  >
                    {observations.length}/{OBSERVATIONS_MAX}
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <Label>Ubicación actual</Label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    {hasGps ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        {geolocation.latitude!.toFixed(6)},{" "}
                        {geolocation.longitude!.toFixed(6)}
                      </p>
                    ) : geolocation.loading ? (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        Obteniendo ubicación…
                      </p>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-3.5" aria-hidden />
                        Sin ubicación GPS
                      </p>
                    )}
                    {geolocation.error ? (
                      <p className="text-xs text-destructive">{geolocation.error}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={geolocation.loading}
                    onClick={() => void handleRefreshGps()}
                  >
                    {geolocation.loading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Actualizando…
                      </>
                    ) : gpsJustUpdated ? (
                      <>
                        <Check className="size-3.5 text-teal-700" />
                        Ubicación actualizada
                      </>
                    ) : (
                      "Actualizar ubicación"
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting || !hasGps || syncing}
                  className="h-11 w-full min-w-[300px] text-base font-semibold bg-teal-700 text-white hover:bg-teal-600 disabled:bg-teal-700/40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    "Iniciar turno"
                  )}
                </Button>
                {!hasGps && !submitting ? (
                  <p className="text-sm text-muted-foreground">
                    Esperando ubicación GPS para iniciar turno
                  </p>
                ) : null}
                {submitError ? (
                  <p
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                    role="alert"
                  >
                    {submitError}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Bus</p>
                  <p className="mt-1 font-semibold">{busPlate ?? "—"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Inicio real</p>
                  <p className="mt-1 font-semibold">
                    {formatDateTime(currentTurn?.startTime)}
                  </p>
                </div>
                {currentTurn?.scheduledStartTime ? (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Hora programada</p>
                    <p className="mt-1 font-semibold">
                      {formatDateTime(currentTurn.scheduledStartTime)}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="mt-1 font-semibold">{currentTurn?.status ?? "—"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enviando posición GPS cada {GPS_INTERVAL_MS / 1000}s vía turno activo.
              </p>
            </div>
          )}
        </div>

        <Card className="border-(--security-border) bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen del turno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-800">
                <User className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Conductor</p>
                <p className="font-medium text-foreground">{driverName ?? "Cargando…"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-800">
                <Bus className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Bus asignado</p>
                <p className="font-medium text-foreground">
                  {busPlate ?? (isActive ? "—" : "Se asignará al iniciar")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-800">
                <Clock className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {isActive ? "Inicio del turno" : "Estado"}
                </p>
                {isActive ? (
                  <p className="font-medium text-foreground">
                    {formatDateTime(currentTurn?.startTime)}
                  </p>
                ) : (
                  <p className="font-medium text-foreground">Sin turno activo</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={endDialogOpen}
        onOpenChange={(open) => {
          if (ending) return;
          setEndDialogOpen(open);
          if (!open) {
            setEndError(null);
            setEndObservations("");
          }
        }}
      >
        <DialogContent className="border-(--security-border)">
          <DialogHeader>
            <DialogTitle>¿Finalizar turno?</DialogTitle>
            <DialogDescription>
              Esto cerrará tu turno activo y liberará el bus. Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="end-observations">Observaciones de cierre (opcional)</Label>
            <div className="relative">
              <Textarea
                id="end-observations"
                value={endObservations}
                onChange={(event) => handleEndObservationsChange(event.target.value)}
                className="min-h-24 pb-7"
                placeholder="Opcional"
                maxLength={OBSERVATIONS_MAX}
                disabled={ending}
              />
              <span
                className={cn(
                  "pointer-events-none absolute bottom-2 right-3 text-xs tabular-nums",
                  endObservations.length >= OBSERVATIONS_MAX
                    ? "text-amber-700"
                    : "text-muted-foreground",
                )}
              >
                {endObservations.length}/{OBSERVATIONS_MAX}
              </span>
            </div>
            {endError ? (
              <p
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {endError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={ending}
              onClick={() => setEndDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={ending}
              onClick={() => void handleEndTurn()}
            >
              {ending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                "Finalizar turno"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
