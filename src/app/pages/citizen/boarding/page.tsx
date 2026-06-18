import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
import { board } from "@/services/boardingService";
import type { BoardingResponse } from "@/services/boardingService";
import { getBuses } from "@/services/busService";
import type { BusItem } from "@/services/busService";
import { getMyPaymentMethods } from "@/services/paymentService";
import type { PaymentMethodItem } from "@/services/paymentService";
import { getActiveTicketId } from "@/services/ticketService";
import { getBoardingStopsForBus } from "@/services/routePlanningService";
import type { BoardingStopOption } from "@/core/domain/entities/business/Transit";
import { useGeolocation } from "@/hooks/useGeolocation";

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
  const geolocation = useGeolocation();
  const activeTicketId = getActiveTicketId();

  useEffect(() => {
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
  }, []);

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

  const handleBoard = async () => {
    if (!busId || !paymentMethodCitizenId || !nodeId) {
      showErrorToast("Selecciona bus, método de pago y paradero.");
      return;
    }

    try {
      setLoading(true);
      const response = await board({ busId, paymentMethodCitizenId, nodeId });
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

  return (
    <PageShell
      title="Abordar bus"
      description="Selecciona el bus, tu tarjeta y el paradero donde abordas."
    >
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
              <SelectTrigger>
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
              <SelectTrigger>
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
                    {method.type} — Saldo {formatCop(method.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingMethods && methods.length === 0 ? (
              <p className="text-xs text-amber-800">
                No tienes métodos de pago vinculados. Un administrador debe asignarlos en{" "}
                <strong>Business → Pagos ciudadano</strong>, o regístralos en recarga de tarjeta.
              </p>
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
              <SelectTrigger>
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
          >
            {loading ? "Procesando..." : "Confirmar abordaje"}
          </Button>
        </div>

        <div className="rounded-lg border p-4 space-y-3 text-sm">
          <p className="font-medium">Ubicación</p>
          <p className="text-muted-foreground">
            Lat: {geolocation.latitude ?? "n/a"} · Lon: {geolocation.longitude ?? "n/a"}
          </p>
          {geolocation.error ? (
            <p className="text-destructive">{geolocation.error}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void geolocation.requestPermission()}
              >
                Actualizar GPS
              </Button>
              {stopOptions.length > 0 ? (
                <Button type="button" variant="secondary" size="sm" onClick={suggestNearestStop}>
                  Paradero más cercano
                </Button>
              ) : null}
            </div>
          )}
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
