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
import { buildRealtimeSocketConfig } from "@/infra/api/realtimeSocket";
import type { RealtimeBusLocation, RealtimeIncident } from "@/core/domain/entities/business";

const DEFAULT_CENTER: [number, number] = [4.6482837, -74.075816];

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MONTH_OPTIONS = [3, 6, 12] as const;

function isBusLikeItem(item: unknown): item is RealtimeBusLocation {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Record<string, unknown>;
  return typeof candidate.busId === "string" && typeof candidate.lat === "number" && typeof candidate.lng === "number";
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
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const realtimeSocketRef = useRef<Socket | null>(null);

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
      const items = await dashboardRepository.getRealtimeFleet(
        enterpriseId === "all" ? undefined : enterpriseId,
        routeFilter === "all" ? undefined : routeFilter,
      );
      const fleet = normalizeFleetPayload(items) ?? [];

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
      setActiveIncidents(normalizeIncidentsPayload(incidents) ?? []);
    } catch (error) {
      console.warn("Error al cargar incidentes activos", error);
    }
  }, [enterpriseId, routeFilter]);

  useEffect(() => {
    void loadRealtimeData();
  }, [loadRealtimeData]);

  useEffect(() => {
    const socketConfig = buildRealtimeSocketConfig();

    if (!socketConfig) {
      return;
    }

    const socket = io(socketConfig.url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 3000,
    });
    realtimeSocketRef.current = socket;

    const handleFleetUpdate = (payload: unknown) => {
      const fleet = normalizeFleetPayload(payload);

      if (!fleet) {
        console.warn("Payload realtime de flota no reconocido", payload);
        return;
      }

      setFleetBuses(fleet);
      if (fleet.length > 0) {
        setMapCenter([fleet[0].lat, fleet[0].lng]);
      }

      const routes = fleet
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

    const handleIncidentsUpdate = (payload: unknown) => {
      const incidents = normalizeIncidentsPayload(payload);

      if (incidents) {
        setActiveIncidents(incidents);
      }
    };

    socket.on("dashboard:realtime:fleet", handleFleetUpdate);
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
      socket.off("dashboard:realtime:fleet", handleFleetUpdate);
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

  const totalActivePassengers = displayedFleetBuses.reduce((acc, bus) => acc + (bus.activePassengers ?? 0), 0);
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
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Pasajeros en tránsito</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{totalActivePassengers}</p>
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

                <div className="h-105 rounded-lg overflow-hidden border">
                  <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {displayedFleetBuses.map((bus) => (
                      <Marker
                        key={bus.busId}
                        position={[bus.lat, bus.lng]}
                        icon={defaultMarkerIcon}
                        eventHandlers={{ click: () => { setSelectedBus(bus); } }}
                      >
                        <Popup>
                          <div className="space-y-1 text-sm">
                            <p className="font-semibold">{bus.plate}</p>
                            <p>{bus.routeName ?? bus.routeCode ?? "Ruta desconocida"}</p>
                            <p>{bus.nearestStop?.name ? `Próximo: ${bus.nearestStop.name}` : "Paradero cercano no disponible"}</p>
                            <p>{bus.estimatedMinutesToNextStop != null ? `ETA: ${String(bus.estimatedMinutesToNextStop)} min` : "ETA no disponible"}</p>
                            <p>{bus.delayAlert ? "Retrasado" : "A tiempo"}</p>
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
                          <p className="text-slate-500">Tiempo estimado</p>
                          <p>{selectedBus.estimatedMinutesToNextStop != null ? `${String(selectedBus.estimatedMinutesToNextStop)} min` : "N/A"}</p>
                        </div>
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
