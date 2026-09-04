import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { io, type Socket } from "socket.io-client";

import { PageShell } from "@/app/components/security/page-shell";
import { useDashboard, useEnterprise } from "@/hooks/business";
import { BUSINESS_LOOKUP_PAGE_SIZE, formatChartColor } from "@/app/components/business/constants";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { dashboardRepository } from "@/infra/repository/business/DashboardRepository";
import {
  buildRealtimeSocketConfig,
  getRealtimeSocketAuthOptions,
} from "@/infra/api/realtimeSocket";
import type { RealtimeBusLocation, RealtimeIncident } from "@/core/domain/entities/business";

const DEFAULT_CENTER: [number, number] = [4.6482837, -74.075816];

const BUS_MARKER_COLORS = {
  green: "#16a34a",
  red: "#dc2626",
  default: "#2563eb",
} as const;

function resolveBusMarkerColor(statusColor?: string): string {
  if (statusColor === "red") {
    return BUS_MARKER_COLORS.red;
  }

  if (statusColor === "green") {
    return BUS_MARKER_COLORS.green;
  }

  return BUS_MARKER_COLORS.default;
}

function createBusMarkerIcon(statusColor?: string) {
  const color = resolveBusMarkerColor(statusColor);

  return L.divIcon({
    className: "bus-marker-icon",
    html: `<div style="
      background:${color};
      width:18px;
      height:18px;
      border-radius:50%;
      border:2px solid #ffffff;
      box-shadow:0 2px 6px rgba(15,23,42,.35);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const busMarkerIcons = new Map<string, L.DivIcon>();

function getBusMarkerIcon(statusColor?: string): L.DivIcon {
  const key = statusColor ?? "default";
  const cached = busMarkerIcons.get(key);
  if (cached) {
    return cached;
  }

  const icon = createBusMarkerIcon(statusColor);
  busMarkerIcons.set(key, icon);
  return icon;
}

const MONTH_OPTIONS = [3, 6, 12] as const;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isBusLikeItem(item: unknown): item is RealtimeBusLocation {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Record<string, unknown>;
  const lat = toFiniteNumber(candidate.lat ?? candidate.latitude);
  const lng = toFiniteNumber(candidate.lng ?? candidate.longitude);
  return typeof candidate.busId === "string" && lat != null && lng != null;
}

function coerceFleetBuses(fleet: RealtimeBusLocation[]): RealtimeBusLocation[] {
  return fleet.map((bus) => {
    const raw = bus as RealtimeBusLocation & { latitude?: number; longitude?: number };
    return {
      ...bus,
      lat: toFiniteNumber(raw.lat ?? raw.latitude) ?? bus.lat,
      lng: toFiniteNumber(raw.lng ?? raw.longitude) ?? bus.lng,
    };
  });
}

function isIncidentLikeItem(item: unknown): item is RealtimeIncident {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Record<string, unknown>;
  return typeof candidate.id === "string" && typeof candidate.description === "string";
}

function normalizeFleetPayload(payload: unknown): RealtimeBusLocation[] | null {
  if (Array.isArray(payload) && payload.every(isBusLikeItem)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as Record<string, unknown>;
    if (Array.isArray(candidate.fleet) && candidate.fleet.every(isBusLikeItem)) {
      return candidate.fleet;
    }

    if (Array.isArray(candidate.items) && candidate.items.every(isBusLikeItem)) {
      return candidate.items;
    }

    if (Array.isArray(candidate.buses) && candidate.buses.every(isBusLikeItem)) {
      return candidate.buses;
    }

    if (isBusLikeItem(candidate.bus)) {
      return [candidate.bus];
    }
  }

  return null;
}

function normalizeIncidentsPayload(payload: unknown): RealtimeIncident[] | null {
  if (Array.isArray(payload) && payload.every(isIncidentLikeItem)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as Record<string, unknown>;
    if (Array.isArray(candidate.incidents) && candidate.incidents.every(isIncidentLikeItem)) {
      return candidate.incidents;
    }

    if (Array.isArray(candidate.items) && candidate.items.every(isIncidentLikeItem)) {
      return candidate.items;
    }

    if (isIncidentLikeItem(candidate.incident)) {
      return [candidate.incident];
    }
  }

  return null;
}

export default function BusinessDashboardPage() {
  const {
    paymentIncome,
    incidentTrend,
    loading,
    loadPaymentIncome,
    loadIncidentTrend,
    exportPaymentIncome,
    exportIncidentTrend,
  } = useDashboard();
  const enterpriseCrud = useEnterprise();

  const [incomeMonths, setIncomeMonths] = useState<number>(6);
  const [trendMonths, setTrendMonths] = useState<number>(12);
  const [enterpriseId, setEnterpriseId] = useState<string>("all");
  const [enterpriseOptions, setEnterpriseOptions] = useState<{ value: string; label: string }[]>([]);
  const [fleetBuses, setFleetBuses] = useState<RealtimeBusLocation[]>([]);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [routeOptions, setRouteOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedBus, setSelectedBus] = useState<RealtimeBusLocation | null>(null);
  const [activeIncidents, setActiveIncidents] = useState<RealtimeIncident[]>([]);
  const [totalPassengersInTransit, setTotalPassengersInTransit] = useState<number>(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const realtimeSocketRef = useRef<Socket | null>(null);
  const enterpriseFilterRef = useRef(enterpriseId);
  const routeFilterRef = useRef(routeFilter);

  useEffect(() => {
    void loadPaymentIncome(incomeMonths);
  }, [incomeMonths, loadPaymentIncome]);

  useEffect(() => {
    void loadIncidentTrend(trendMonths, enterpriseId === "all" ? undefined : enterpriseId);
  }, [trendMonths, enterpriseId, loadIncidentTrend]);

  useEffect(() => {
    void enterpriseCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setEnterpriseOptions(p.items.map((e) => ({ value: e.id, label: e.name })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRealtimeData = useCallback(async () => {
    setFleetError(null);

    try {
      const fleet = coerceFleetBuses(
        await dashboardRepository.getRealtimeFleet(
          enterpriseId === "all" ? undefined : enterpriseId,
          routeFilter === "all" ? undefined : routeFilter,
        ),
      );

      setFleetBuses(fleet);
      if (fleet.length > 0) {
        setMapCenter([fleet[0].lat, fleet[0].lng]);
      }

      const routes = fleet
        .filter((bus) => bus.routeId)
        .reduce<{ value: string; label: string }[]>((acc, bus) => {
          if (!acc.some((item) => item.value === bus.routeId)) {
            acc.push({ value: bus.routeId ?? "", label: bus.routeName ?? bus.routeCode ?? bus.routeId ?? "Ruta desconocida" });
          }
          return acc;
        }, []);
      setRouteOptions(routes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar la flota en tiempo real";
      setFleetError(message);
      toast.error(message);
    }

    try {
      const incidents = await dashboardRepository.getActiveRealtimeIncidents();
      setActiveIncidents(incidents);
    } catch (error) {
      console.warn("Error al cargar incidentes activos", error);
    }

    try {
      const summary = await dashboardRepository.getRealtimeSummary(
        enterpriseId === "all" ? undefined : enterpriseId,
      );
      setTotalPassengersInTransit(summary.totalPassengersInTransit);
      if (summary.incidents?.length) {
        setActiveIncidents(summary.incidents);
      }
    } catch (error) {
      console.warn("Error al cargar resumen en tiempo real", error);
    }
  }, [enterpriseId, routeFilter]);

  useEffect(() => {
    void loadRealtimeData();
    // El script demo escribe GPS directo en BD (sin WS). Polling garantiza movimiento en mapa.
    const intervalId = window.setInterval(() => {
      void loadRealtimeData();
    }, 5_000);
    return () => window.clearInterval(intervalId);
  }, [loadRealtimeData]);

  useEffect(() => {
    enterpriseFilterRef.current = enterpriseId;
    routeFilterRef.current = routeFilter;
    const socket = realtimeSocketRef.current;
    if (socket?.connected) {
      socket.emit("dashboard:subscribe-fleet", {
        enterpriseId: enterpriseId === "all" ? undefined : enterpriseId,
        routeId: routeFilter === "all" ? undefined : routeFilter,
      });
      socket.emit("dashboard:subscribe-dashboard", {
        enterpriseId: enterpriseId === "all" ? undefined : enterpriseId,
      });
    }
  }, [enterpriseId, routeFilter]);

  useEffect(() => {
    const socketConfig = buildRealtimeSocketConfig();

    if (!socketConfig) {
      return;
    }

    const authOptions = getRealtimeSocketAuthOptions(socketConfig);
    if (!authOptions) {
      return;
    }

    const socket = io(socketConfig.url, authOptions);
    realtimeSocketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("dashboard:subscribe-fleet", {
        enterpriseId: enterpriseFilterRef.current === "all" ? undefined : enterpriseFilterRef.current,
        routeId: routeFilterRef.current === "all" ? undefined : routeFilterRef.current,
      });
      socket.emit("dashboard:subscribe-dashboard", {
        enterpriseId: enterpriseFilterRef.current === "all" ? undefined : enterpriseFilterRef.current,
      });
    });

    const applyFleetUpdate = (fleet: RealtimeBusLocation[]) => {
      const normalized = coerceFleetBuses(fleet);
      setFleetBuses(normalized);
      if (normalized.length > 0) {
        setMapCenter([normalized[0].lat, normalized[0].lng]);
      }

      const routes = normalized
        .filter((bus) => bus.routeId)
        .reduce<{ value: string; label: string }[]>((acc, bus) => {
          if (!acc.some((item) => item.value === bus.routeId)) {
            acc.push({
              value: bus.routeId ?? "",
              label: bus.routeName ?? bus.routeCode ?? bus.routeId ?? "Ruta desconocida",
            });
          }
          return acc;
        }, []);
      setRouteOptions(routes);
    };

    const handleFleetUpdate = (payload: unknown) => {
      const fleet = normalizeFleetPayload(payload);

      if (!fleet) {
        console.warn("Payload realtime de flota no reconocido", payload);
        return;
      }

      applyFleetUpdate(fleet);
    };

    const handleSummaryUpdate = (payload: unknown) => {
      if (!payload || typeof payload !== "object") {
        return;
      }

      const summary = payload as Record<string, unknown>;
      if (typeof summary.totalPassengersInTransit === "number") {
        setTotalPassengersInTransit(summary.totalPassengersInTransit);
      }

      const incidents = normalizeIncidentsPayload(summary.incidents);
      if (incidents) {
        setActiveIncidents(incidents);
      }

      const fleet = normalizeFleetPayload(summary.fleet);
      if (fleet) {
        applyFleetUpdate(fleet);
      }
    };

    const handleIncidentsUpdate = (payload: unknown) => {
      const incidents = normalizeIncidentsPayload(payload);

      if (incidents) {
        setActiveIncidents(incidents);
      }
    };

    socket.on("dashboard:realtime:fleet", handleFleetUpdate);
    socket.on("dashboard:realtime:summary", handleSummaryUpdate);
    socket.on("dashboard:realtime:incidents", handleIncidentsUpdate);
    socket.on("connect_error", (error) => {
      console.warn("Error de conexion realtime", {
        message: error.message,
        url: socketConfig.url,
        namespace: socketConfig.namespace,
        origin: socketConfig.origin,
      });
    });

    return () => {
      socket.off("connect");
      socket.off("dashboard:realtime:fleet", handleFleetUpdate);
      socket.off("dashboard:realtime:summary", handleSummaryUpdate);
      socket.off("dashboard:realtime:incidents", handleIncidentsUpdate);
      socket.disconnect();
      realtimeSocketRef.current = null;
    };
  }, []);

  const incomeChartData = useMemo(() => {
    if (!paymentIncome) return [];
    return paymentIncome.labels.map((label, index) => {
      const row: Record<string, string | number> = { month: label };
      paymentIncome.datasets.forEach((ds) => {
        row[ds.paymentMethodId] = ds.data[index] ?? 0;
      });
      return row;
    });
  }, [paymentIncome]);

  const incomeChartConfig = useMemo(() => {
    if (!paymentIncome) return {} satisfies ChartConfig;
    const config: ChartConfig = {};
    paymentIncome.datasets.forEach((ds, i) => {
      config[ds.paymentMethodId] = {
        label: ds.paymentMethodName,
        color: formatChartColor(i),
      };
    });
    return config;
  }, [paymentIncome]);

  const trendChartData = useMemo(() => {
    if (!incidentTrend) return [];
    return incidentTrend.labels.map((label, index) => {
      const row: Record<string, string | number> = { month: label };
      incidentTrend.datasets.forEach((ds) => {
        row[ds.type] = ds.data[index] ?? 0;
      });
      return row;
    });
  }, [incidentTrend]);

  const trendChartConfig = useMemo(() => {
    if (!incidentTrend) return {} satisfies ChartConfig;
    const config: ChartConfig = {};
    incidentTrend.datasets.forEach((ds, i) => {
      config[ds.type] = {
        label: ds.typeLabel,
        color: formatChartColor(i),
      };
    });
    return config;
  }, [incidentTrend]);

  const displayedFleetBuses = useMemo(
    () => (routeFilter === "all" ? fleetBuses : fleetBuses.filter((bus) => bus.routeId === routeFilter)),
    [fleetBuses, routeFilter],
  );

  const totalActivePassengers = useMemo(() => {
    const fleetTotal = displayedFleetBuses.reduce((acc, bus) => acc + (bus.activePassengers ?? 0), 0);
    return Math.max(totalPassengersInTransit, fleetTotal);
  }, [displayedFleetBuses, totalPassengersInTransit]);
  const totalFullBuses = displayedFleetBuses.filter((bus) => bus.isFull).length;
  const delayedBusesCount = displayedFleetBuses.filter((bus) => bus.delayAlert).length;

  return (
    <PageShell
      title="Dashboard Business"
      description="Analítica de ingresos e incidentes."
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Monitoreo de flota en tiempo real</CardTitle>
              <CardDescription>Ubicación actual de buses activos, estado y alertas.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todas las rutas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las rutas</SelectItem>
                  {routeOptions.map((route) => (
                    <SelectItem key={route.value} value={route.value}>
                      {route.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={enterpriseId} onValueChange={setEnterpriseId}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {enterpriseOptions.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadRealtimeData()}>
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Buses activos</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{displayedFleetBuses.length}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">Pasajeros en tránsito</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-900">{totalActivePassengers}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Ocupación máxima</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{totalFullBuses}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Buses retrasados</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{delayedBusesCount}</p>
                  </div>
                </div>

                {fleetError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {fleetError}
                  </div>
                )}

                <div className="relative h-105 rounded-lg overflow-hidden border">
                  <div className="absolute right-3 top-3 z-1000 rounded-lg border border-slate-200 bg-white/95 p-3 text-xs text-slate-700 shadow-sm">
                    <p className="mb-2 font-semibold text-slate-900">Estado de buses</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: BUS_MARKER_COLORS.green }} />
                      <span>Normal</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: BUS_MARKER_COLORS.red }} />
                      <span>Incidente</span>
                    </div>
                  </div>
                  <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {displayedFleetBuses.map((bus) => (
                      <Marker
                        key={`${bus.busId}:${bus.lat.toFixed(6)}:${bus.lng.toFixed(6)}`}
                        position={[bus.lat, bus.lng]}
                        icon={getBusMarkerIcon(bus.statusColor)}
                        eventHandlers={{ click: () => { setSelectedBus(bus); } }}
                      >
                        <Popup>
                          <div className="space-y-1 text-sm">
                            <p className="font-semibold">{bus.plate}</p>
                            <p>{bus.routeName ?? bus.routeCode ?? "Ruta desconocida"}</p>
                            <p>{bus.statusColor === "red" ? "Estado: incidente activo" : "Estado: normal"}</p>
                            <p>{bus.nearestStop?.name ? `Próximo: ${bus.nearestStop.name}` : "Paradero cercano no disponible"}</p>
                            <p>{bus.estimatedMinutesToNextStop != null ? `ETA próximo: ${String(bus.estimatedMinutesToNextStop)} min` : "ETA no disponible"}</p>
                            {bus.estimatedMinutesToWaitingStop != null && (
                              <p className="font-semibold text-blue-700">ETA a tu paradero: {bus.estimatedMinutesToWaitingStop} min</p>
                            )}
                            <p>{bus.delayAlert ? "Retrasado" : "A tiempo"}</p>
                            <p>Pasajeros a bordo: {bus.activePassengers ?? 0}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
              <div className="space-y-4">
                <Card className="border border-slate-200 bg-slate-50">
                  <CardHeader>
                    <CardTitle>Detalle de bus seleccionado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedBus ? (
                      <div className="space-y-3 text-sm text-slate-700">
                        <div>
                          <p className="text-slate-500">Bus</p>
                          <p className="text-lg font-semibold">{selectedBus.plate}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Ruta</p>
                          <p>{selectedBus.routeName ?? selectedBus.routeCode ?? "No asignada"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Estado</p>
                          <p>{selectedBus.statusColor === "red" ? "Incidente" : "Normal"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Paradero cercano</p>
                          <p>{selectedBus.nearestStop?.name ?? "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">ETA próximo paradero</p>
                          <p>{selectedBus.estimatedMinutesToNextStop != null ? `${String(selectedBus.estimatedMinutesToNextStop)} min` : "N/A"}</p>
                        </div>
                        {selectedBus.estimatedMinutesToWaitingStop != null && (
                          <div>
                            <p className="text-slate-500">ETA a tu paradero</p>
                            <p className="font-semibold text-blue-700">{selectedBus.estimatedMinutesToWaitingStop} min</p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-500">Ocupación</p>
                          <p>{selectedBus.isFull ? "Máxima" : `${String(selectedBus.occupancyPercent ?? 0)}%`}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Haz clic en un bus del mapa para ver su detalle aquí.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-slate-50">
                  <CardHeader>
                    <CardTitle>Alertas rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-700">
                    <p>{displayedFleetBuses.length === 0 ? "No hay buses activos para mostrar." : "Selecciona un bus en el mapa para ver más detalles."}</p>
                    {delayedBusesCount > 0 && (
                      <div className="rounded-lg bg-red-100 p-3 text-red-800">
                        {delayedBusesCount} bus(es) en retraso.
                      </div>
                    )}
                    {totalFullBuses > 0 && (
                      <div className="rounded-lg bg-orange-100 p-3 text-orange-800">
                        {totalFullBuses} bus(es) con ocupación máxima.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Incidentes activos</CardTitle>
              <CardDescription>Lista de incidentes no resueltos reportados en la flota.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void loadRealtimeData()}>
                Refrescar incidentes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay incidentes activos en este momento.</p>
            ) : (
              <div className="space-y-3">
                {activeIncidents.map((incident) => (
                  <div key={incident.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Bus</p>
                        <p className="font-semibold">{incident.busPlate ?? incident.busId}</p>
                      </div>
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                        {incident.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{incident.description}</p>
                    <p className="mt-2 text-xs text-slate-500">Reportado: {new Date(incident.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Ingresos por método de pago</CardTitle>
              <CardDescription>
                Total: {paymentIncome ? paymentIncome.grandTotal.toLocaleString() : "—"}
                {paymentIncome && paymentIncome.excludedTicketsCount > 0
                  ? ` · ${String(paymentIncome.excludedTicketsCount)} tickets excluidos`
                  : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={String(incomeMonths)}
                onValueChange={(v) => { setIncomeMonths(Number(v)); }}
              >
                <SelectTrigger className="w-30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} meses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void exportPaymentIncome(incomeMonths)}
              >
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !paymentIncome ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : incomeChartData.length > 0 ? (
              <ChartContainer config={incomeChartConfig} className="h-90 w-full">
                <BarChart data={incomeChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {paymentIncome?.datasets.map((ds) => (
                    <Bar
                      key={ds.paymentMethodId}
                      dataKey={ds.paymentMethodId}
                      stackId="income"
                      fill={`var(--color-${ds.paymentMethodId})`}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos para el período.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Evolución de incidentes por tipo</CardTitle>
              <CardDescription>
                Total: {incidentTrend?.grandTotal ?? "—"}
                {incidentTrend?.scope.enterpriseName
                  ? ` · ${incidentTrend.scope.enterpriseName}`
                  : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={String(trendMonths)}
                onValueChange={(v) => { setTrendMonths(Number(v)); }}
              >
                <SelectTrigger className="w-30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} meses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={enterpriseId} onValueChange={setEnterpriseId}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {enterpriseOptions.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  void exportIncidentTrend(
                    trendMonths,
                    enterpriseId === "all" ? undefined : enterpriseId,
                  )
                }
              >
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !incidentTrend ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : trendChartData.length > 0 ? (
              <ChartContainer config={trendChartConfig} className="h-90 w-full">
                <LineChart data={trendChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {incidentTrend?.datasets.map((ds) => (
                    <Line
                      key={ds.type}
                      type="monotone"
                      dataKey={ds.type}
                      stroke={`var(--color-${ds.type})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos para el período.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
