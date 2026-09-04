import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Bus, Check, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/app/components/security/page-shell";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatCop } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { board } from "@/services/boardingService";
import type { BoardingResponse } from "@/services/boardingService";
import { getBuses } from "@/services/busService";
import type { BusItem } from "@/services/busService";
import { getMyPaymentMethods } from "@/services/paymentService";
import type { PaymentMethodItem } from "@/services/paymentService";
import { getActiveTicketId, setActiveTicketSnapshot } from "@/services/ticketService";
import { getBoardingStopsForBus } from "@/services/routePlanningService";
import type { BoardingStopOption } from "@/core/domain/entities/business/Transit";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCitizenProfile } from "@/hooks/useCitizenProfile";
import { useGeolocationStore } from "@/store/geolocationStore";

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function pickNearestStop(
  stops: BoardingStopOption[],
  lat: number | null,
  lon: number | null,
): string {
  if (!lat || !lon || stops.length === 0) {
    return stops[0]?.nodeId ?? "";
  }

  let nearest = stops[0];
  let minDist = distanceKm(lat, lon, nearest.latitude, nearest.longitude);

  for (const stop of stops.slice(1)) {
    const d = distanceKm(lat, lon, stop.latitude, stop.longitude);
    if (d < minDist) {
      minDist = d;
      nearest = stop;
    }
  }

  return nearest.nodeId;
}

type FocusField = "bus" | "payment" | "stop" | null;

export default function CitizenBoardingPage() {
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [busId, setBusId] = useState("");
  const [paymentMethodCitizenId, setPaymentMethodCitizenId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [stopOptions, setStopOptions] = useState<BoardingStopOption[]>([]);
  const [routeName, setRouteName] = useState("");
  const [loadingStops, setLoadingStops] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BoardingResponse | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [gpsJustUpdated, setGpsJustUpdated] = useState(false);
  const geolocation = useGeolocation();
  const { hasCitizenProfile, loading: loadingCitizenProfile } = useCitizenProfile();
  const activeTicketId = getActiveTicketId();

  useEffect(() => {
    if (hasCitizenProfile !== true) {
      setLoadingMethods(false);
      return;
    }
    void getBuses()
      .then(setBuses)
      .catch((error) => {
        showErrorToast(getApiErrorMessage(error, "Error cargando buses"));
      });
    void getMyPaymentMethods()
      .then((items) => {
        setMethods(items);
        if (items.length === 1) {
          setPaymentMethodCitizenId(items[0].id);
        }
      })
      .catch((error) => {
        showErrorToast(getApiErrorMessage(error, "Error cargando métodos de pago"));
      })
      .finally(() => {
        setLoadingMethods(false);
      });
  }, [hasCitizenProfile]);

  const loadStopsForBus = useCallback(async (selectedBusId: string) => {
    if (!selectedBusId) {
      setStopOptions([]);
      setRouteName("");
      setNodeId("");
      return;
    }

    setLoadingStops(true);
    setNodeId("");
    try {
      const { routeName: name, stops } = await getBoardingStopsForBus(selectedBusId);
      setRouteName(name);
      setStopOptions(stops);
    } catch (error) {
      setStopOptions([]);
      setRouteName("");
      showErrorToast(getApiErrorMessage(error, "No se pudieron cargar los paraderos"));
    } finally {
      setLoadingStops(false);
    }
  }, []);

  useEffect(() => {
    void loadStopsForBus(busId);
  }, [busId, loadStopsForBus]);

  useEffect(() => {
    if (stopOptions.length === 0 || nodeId) {
      return;
    }
    const suggested = pickNearestStop(
      stopOptions,
      geolocation.latitude,
      geolocation.longitude,
    );
    if (suggested) {
      setNodeId(suggested);
    }
  }, [stopOptions, geolocation.latitude, geolocation.longitude, nodeId]);

  const selectedMethod = methods.find((m) => m.id === paymentMethodCitizenId);
  const selectedStop = stopOptions.find((s) => s.nodeId === nodeId);

  const stopLabel = useMemo(() => {
    if (!selectedStop) return "";
    const location = selectedStop.location ? ` — ${selectedStop.location}` : "";
    return `${selectedStop.order}. ${selectedStop.name}${location}`;
  }, [selectedStop]);

  const focusField: FocusField = useMemo(() => {
    if (!busId) return "bus";
    if (!loadingMethods && methods.length > 0 && !paymentMethodCitizenId) return "payment";
    if (busId && !loadingStops && stopOptions.length > 0 && !nodeId) return "stop";
    return null;
  }, [
    busId,
    loadingMethods,
    methods.length,
    paymentMethodCitizenId,
    loadingStops,
    stopOptions.length,
    nodeId,
  ]);

  const hasLocation = geolocation.latitude != null && geolocation.longitude != null;

  const mapEmbedUrl = useMemo(() => {
    if (!hasLocation) return null;
    const lat = geolocation.latitude!;
    const lon = geolocation.longitude!;
    const delta = 0.008;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lon}`;
  }, [hasLocation, geolocation.latitude, geolocation.longitude]);

  const handleBoard = async () => {
    if (!busId || !paymentMethodCitizenId || !nodeId) {
      showErrorToast("Selecciona bus, método de pago y paradero.");
      return;
    }

    try {
      setLoading(true);
      const response = await board({ busId, paymentMethodCitizenId, nodeId });
      const bus = buses.find((b) => b.id === busId);
      setActiveTicketSnapshot({
        id: response.ticketId,
        boardedAt: response.boardedAt,
        busId,
        busPlate: bus?.plate,
        routeName: routeName || undefined,
        boardingStopName: selectedStop?.name,
      });
      setResult(response);
      showSuccessToast(response.message ?? "Abordaje registrado con éxito.");
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Error al abordar"));
    } finally {
      setLoading(false);
    }
  };

  const handleBusChange = (value: string) => {
    setBusId(value);
  };

  const suggestNearestStop = () => {
    if (stopOptions.length === 0) return;
    const suggested = pickNearestStop(
      stopOptions,
      geolocation.latitude,
      geolocation.longitude,
    );
    if (suggested) {
      setNodeId(suggested);
    }
  };

  const handleRefreshGps = async () => {
    setGpsJustUpdated(false);
    await geolocation.requestPermission();
    const { error, coordinates } = useGeolocationStore.getState();
    if (!error && coordinates) {
      setGpsJustUpdated(true);
      window.setTimeout(() => setGpsJustUpdated(false), 2500);
    }
  };

  const selectFocusClass = (field: FocusField) =>
    cn(
      "w-full",
      focusField === field &&
        "border-teal-600 ring-2 ring-teal-600/25 data-[placeholder]:text-foreground",
    );

  return (
    <PageShell
      title="Abordar bus"
      description="Selecciona el bus, tu tarjeta y el paradero donde abordas."
      titleSize="lg"
      titleIcon={<Bus className="size-8 shrink-0 text-teal-700" aria-hidden />}
    >
      {loadingCitizenProfile ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          Verificando perfil de ciudadano…
        </div>
      ) : null}

      {hasCitizenProfile === false ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Debes registrar tu perfil de ciudadano</p>
          <p className="mt-1">
            Los pagos y el abordaje dependen del perfil en ms-business, no solo del rol.
          </p>
          <Button asChild className="mt-3" size="sm">
            <Link to="/app/register-profile">Completar perfil ciudadano</Link>
          </Button>
        </div>
      ) : null}

      {activeTicketId && !result ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Tienes un boleto activo ({activeTicketId.slice(0, 8)}…).{" "}
          <Link to={`/app/ticket/${activeTicketId}/alight`} className="font-semibold underline">
            Registrar descenso
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bus</Label>
            <Select value={busId} onValueChange={handleBusChange}>
              <SelectTrigger className={selectFocusClass("bus")}>
                <SelectValue placeholder="Selecciona un bus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.plate}
                    {bus.model ? ` — ${bus.model}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select
              value={paymentMethodCitizenId || undefined}
              onValueChange={setPaymentMethodCitizenId}
              disabled={loadingMethods || methods.length === 0}
            >
              <SelectTrigger className={selectFocusClass("payment")}>
                <SelectValue
                  placeholder={
                    loadingMethods
                      ? "Cargando métodos..."
                      : methods.length === 0
                        ? "Sin métodos vinculados"
                        : "Selecciona método de pago"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {methods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.type}
                    {method.isRechargeable || method.code === "SYSTEM_CARD"
                      ? ` — Saldo ${formatCop(method.balance)}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingMethods && methods.length === 0 ? (
              <div
                className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                role="status"
              >
                <div className="flex items-start gap-2 text-sm text-amber-950">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                  <p className="font-medium">Necesitas una tarjeta para abordar</p>
                </div>
                <Button asChild size="sm" className="shrink-0 bg-teal-700 hover:bg-teal-600 text-white">
                  <Link to="/app/payment-methods">Vincular método de pago</Link>
                </Button>
              </div>
            ) : null}
            {selectedMethod ? (
              <p className="text-xs text-muted-foreground">
                Saldo actual: {formatCop(selectedMethod.balance)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Paradero</Label>
            <Select
              value={nodeId}
              onValueChange={setNodeId}
              disabled={!busId || loadingStops || stopOptions.length === 0}
            >
              <SelectTrigger className={selectFocusClass("stop")}>
                <SelectValue
                  placeholder={
                    !busId
                      ? "Primero selecciona un bus"
                      : loadingStops
                        ? "Cargando paraderos..."
                        : stopOptions.length === 0
                          ? "Sin paraderos en la ruta"
                          : "Selecciona un paradero"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {stopOptions.map((stop) => (
                  <SelectItem key={stop.nodeId} value={stop.nodeId}>
                    {stop.order}. {stop.name}
                    {stop.location ? ` — ${stop.location}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingStops ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando paraderos de la ruta programada…
              </p>
            ) : routeName ? (
              <p className="text-xs text-muted-foreground">Ruta: {routeName}</p>
            ) : null}
            {selectedStop && stopLabel ? (
              <p className="text-xs text-muted-foreground">Seleccionado: {stopLabel}</p>
            ) : null}
          </div>

          <Button
            type="button"
            onClick={() => void handleBoard()}
            disabled={loading || loadingStops || !nodeId || !paymentMethodCitizenId}
            className="h-11 w-full text-base font-semibold bg-teal-700 text-white shadow-sm hover:bg-teal-600 disabled:bg-teal-700/40"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando…
              </>
            ) : (
              "Confirmar abordaje"
            )}
          </Button>
          {!loading && (!busId || !paymentMethodCitizenId || !nodeId) ? (
            <p className="text-sm text-muted-foreground">
              {!busId
                ? "Selecciona un bus para continuar"
                : methods.length === 0
                  ? "Necesitas una tarjeta para abordar"
                  : !paymentMethodCitizenId
                    ? "Selecciona un método de pago para continuar"
                    : "Selecciona bus y paradero para continuar"}
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border p-4 space-y-3 text-sm">
          <p className="font-medium">Ubicación</p>
          {hasLocation ? (
            <div className="flex items-center gap-2 text-teal-800">
              <span className="flex size-6 items-center justify-center rounded-full bg-teal-100">
                <Check className="size-3.5" aria-hidden />
              </span>
              <p className="font-medium">Ubicación detectada</p>
            </div>
          ) : geolocation.loading ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Obteniendo ubicación…
            </p>
          ) : (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" aria-hidden />
              Aún no tenemos tu ubicación
            </p>
          )}
          {geolocation.error ? (
            <p className="text-destructive text-xs">{geolocation.error}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
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
                "Actualizar GPS"
              )}
            </Button>
            {hasLocation && mapEmbedUrl ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowMap((v) => !v)}
              >
                {showMap ? "Ocultar mapa" : "Ver mapa"}
              </Button>
            ) : null}
            {stopOptions.length > 0 ? (
              <Button type="button" variant="secondary" size="sm" onClick={suggestNearestStop}>
                Paradero más cercano
              </Button>
            ) : null}
          </div>
          {showMap && mapEmbedUrl ? (
            <div className="overflow-hidden rounded-md border">
              <iframe
                title="Tu ubicación"
                src={mapEmbedUrl}
                className="h-48 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Al elegir el bus se cargan los paraderos de su ruta programada. Puedes usar GPS para
            sugerir el más cercano.
          </p>
        </div>
      </div>

      {result ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
          <p className="font-semibold text-green-900">{result.message}</p>
          <p className="text-sm">Boleto: {result.ticketId}</p>
          <p className="text-sm">Saldo restante: {formatCop(result.remainingBalance)}</p>
          <p className="text-sm text-muted-foreground">
            Abordado: {new Date(result.boardedAt).toLocaleString("es-CO")}
          </p>
          <Button asChild variant="secondary" className="mt-2">
            <Link to={`/app/ticket/${result.ticketId}/alight`}>Ir a descenso</Link>
          </Button>
        </div>
      ) : null}
    </PageShell>
  );
}
