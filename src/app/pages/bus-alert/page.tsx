import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Bus,
  CheckCircle2,
  CreditCard,
  Loader2,
  Map,
  MapPin,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/security/authStore";
import { useBusAlert } from "@/hooks/useBusAlert";
import type { ArrivalNotificationPayload } from "@/core/domain/entities/business";

const ANTICIPATION_OPTIONS = [
  { value: 5, label: "5 minutos antes" },
  { value: 10, label: "10 minutos antes" },
  { value: 15, label: "15 minutos antes" },
] as const;

type AnticipationMinutes = 5 | 10 | 15;

const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function BusAlertPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);

  const stopId = searchParams.get("stopId") ?? "";
  const routeId = searchParams.get("routeId") ?? "";
  const stopName = searchParams.get("stopName") ?? "Paradero seleccionado";
  const routeName = searchParams.get("routeName") ?? "Ruta seleccionada";

  const [anticipationMinutes, setAnticipationMinutes] = useState<AnticipationMinutes>(5);
  const [arrival, setArrival] = useState<ArrivalNotificationPayload | null>(null);
  const [showMap, setShowMap] = useState(false);

  const handleArrival = useCallback((payload: ArrivalNotificationPayload) => {
    setArrival(payload);
    if (payload.busId && payload.status?.lat != null && payload.status?.lng != null) {
      setShowMap(false);
    }
  }, []);

  const { connected, alertState, trackedBus, activateAlert, trackBus, reset } = useBusAlert({
    userEmail: currentUser?.email,
    onArrival: handleArrival,
  });

  const hasParams = stopId && routeId;

  const handleActivate = async () => {
    if (!hasParams) return;
    await activateAlert({
      stopId,
      routeId,
      anticipationMinutes,
    });
  };

  const handleTrackBus = (busId: string) => {
    trackBus(busId, stopId || undefined);
    setShowMap(true);
  };

  const handleReset = () => {
    reset();
    setArrival(null);
    setShowMap(false);
  };

  const busLat = trackedBus?.lat ?? arrival?.status?.lat;
  const busLng = trackedBus?.lng ?? arrival?.status?.lng;
  const busEta = trackedBus?.estimatedMinutesToWaitingStop
    ?? trackedBus?.etaMinutes
    ?? arrival?.etaMinutes;

  return (
    <PageShell
      title="Alerta de bus"
      description="Recibe un aviso en tiempo real cuando tu bus esté cerca."
    >
      <div className="max-w-2xl space-y-4">

        {/* Back + connection indicator */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/nearby-stops">
              <ArrowLeft className="mr-1 size-4" />
              Paraderos cercanos
            </Link>
          </Button>
          <Badge variant={connected ? "default" : "secondary"} className="gap-1">
            {connected
              ? <><Wifi className="size-3" /> Conectado</>
              : <><WifiOff className="size-3" /> Sin conexión</>}
          </Badge>
        </div>

        {/* No params fallback */}
        {!hasParams && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div className="space-y-2">
                  <p className="font-medium text-amber-800">Selecciona un paradero primero</p>
                  <p className="text-sm text-amber-700">
                    Para activar una alerta, accede desde la lista de paraderos cercanos y elige una ruta.
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/app/nearby-stops">Ir a paraderos cercanos</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stop + route info */}
        {hasParams && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-blue-600" />
                {stopName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Bus className="size-4 shrink-0 text-slate-500" />
                <span className="text-sm text-slate-700">{routeName}</span>
              </div>

              {/* Anticipation selector */}
              {!alertState.active && !alertState.sent && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Avisarme con anticipación de:</p>
                  <Select
                    value={String(anticipationMinutes)}
                    onValueChange={(v) => { setAnticipationMinutes(Number(v) as AnticipationMinutes); }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANTICIPATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Activate button */}
              {!alertState.active && !alertState.sent && (
                <Button
                  className="w-full"
                  onClick={() => void handleActivate()}
                  disabled={alertState.loading || !connected}
                >
                  {alertState.loading ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" />Activando...</>
                  ) : (
                    <><Bell className="mr-2 size-4" />Activar alerta</>
                  )}
                </Button>
              )}

              {/* Connection warning */}
              {!connected && !alertState.active && (
                <p className="text-center text-xs text-amber-600">
                  Conectando al servidor… espera un momento.
                </p>
              )}

              {/* Error */}
              {alertState.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {alertState.error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active alert status */}
        {(alertState.active || alertState.scheduled || alertState.sent) && !arrival && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                  <div className="space-y-1">
                    <p className="font-medium text-green-800">
                      {alertState.sent ? "¡Alerta inmediata!" : "Alerta programada"}
                    </p>
                    <p className="text-sm text-green-700">
                      {alertState.sent
                        ? "Tu bus ya está cerca. Revisa tu correo."
                        : `Te avisaremos cuando el bus esté a ${anticipationMinutes} min de ${alertState.stopName ?? stopName}.`}
                    </p>
                    {alertState.etaMinutes != null && (
                      <p className="text-sm font-semibold text-green-800">
                        ETA actual: {alertState.etaMinutes} min
                      </p>
                    )}
                    {currentUser?.email && (
                      <p className="text-xs text-green-600">
                        Correo de respaldo: {currentUser.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <BellRing className="size-3 animate-pulse" />
                  Escuchando
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Arrival notification card */}
        {arrival && (
          <Card className="border-blue-300 bg-blue-50 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <BellRing className="size-5 animate-bounce text-blue-600" />
                  ¡Tu bus está cerca!
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => setArrival(null)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {arrival.routeName && (
                  <div>
                    <p className="text-slate-500">Ruta</p>
                    <p className="font-semibold text-slate-800">{arrival.routeName}</p>
                  </div>
                )}
                {arrival.plate && (
                  <div>
                    <p className="text-slate-500">Placa</p>
                    <p className="font-semibold text-slate-800">{arrival.plate}</p>
                  </div>
                )}
                {arrival.etaMinutes != null && (
                  <div>
                    <p className="text-slate-500">Llega en aprox.</p>
                    <p className="text-2xl font-bold text-blue-700">{arrival.etaMinutes} min</p>
                  </div>
                )}
                {arrival.stopName && (
                  <div>
                    <p className="text-slate-500">Paradero</p>
                    <p className="font-semibold text-slate-800">{arrival.stopName}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {arrival.busId && (
                  <Button
                    size="sm"
                    onClick={() => { handleTrackBus(arrival.busId!); }}
                  >
                    <Map className="mr-1.5 size-4" />
                    Ver bus en mapa
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { navigate("/app/card-recharge"); }}
                >
                  <CreditCard className="mr-1.5 size-4" />
                  Preparar pago
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live tracking map */}
        {showMap && busLat != null && busLng != null && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bus className="size-4 text-blue-600" />
                  Seguimiento en vivo
                  {busEta != null && (
                    <Badge variant="secondary">{busEta} min a tu paradero</Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowMap(false); }}
                >
                  <X className="mr-1 size-3" />
                  Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-72 overflow-hidden rounded-b-lg">
                <MapContainer
                  center={[busLat, busLng]}
                  zoom={15}
                  className="h-full w-full"
                  key={`${busLat}-${busLng}`}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[busLat, busLng]} icon={markerIcon}>
                    <Popup>
                      <div className="space-y-1 text-sm">
                        {arrival?.plate && <p className="font-semibold">{arrival.plate}</p>}
                        {arrival?.routeName && <p>{arrival.routeName}</p>}
                        {busEta != null && <p>ETA: {busEta} min</p>}
                        {trackedBus?.isFull && (
                          <p className="text-orange-600 font-medium">Bus lleno</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reset / new alert */}
        {(alertState.active || alertState.sent || alertState.scheduled) && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Cancelar alerta
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
