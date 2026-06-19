import { httpMsBussines } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  IncidentTrend,
  PaymentMethodIncome,
  RealtimeBusLocation,
  RealtimeDashboardSummary,
  RealtimeIncident,
  CreateArrivalNotificationDTO,
  ArrivalNotificationResponse,
} from "@/core/domain/entities/business";

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapResponse(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  return value.data ?? value.result ?? value.payload ?? value.item ?? value;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function toNumberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.map((item) => toNumber(item)) : [];
}

function normalizePeriod(value: unknown, months: number) {
  const period = isRecord(value) ? value : {};

  return {
    start: typeof period.start === "string" ? period.start : "",
    end: typeof period.end === "string" ? period.end : "",
    months: toNumber(period.months, months),
  };
}

function normalizePaymentMethodIncome(value: unknown, months: number): PaymentMethodIncome {
  const raw = unwrapResponse(value);
  const source = isRecord(raw) ? raw : {};
  const datasets = Array.isArray(source.datasets) ? source.datasets : [];

  return {
    period: normalizePeriod(source.period, months),
    labels: toStringArray(source.labels),
    datasets: datasets.map((dataset, index) => {
      const item = isRecord(dataset) ? dataset : {};
      const paymentMethodId =
        typeof item.paymentMethodId === "string" && item.paymentMethodId.trim()
          ? item.paymentMethodId
          : `payment-method-${String(index + 1)}`;

      return {
        paymentMethodId,
        paymentMethodName:
          typeof item.paymentMethodName === "string" && item.paymentMethodName.trim()
            ? item.paymentMethodName
            : paymentMethodId,
        data: toNumberArray(item.data),
        totalIncome: toNumber(item.totalIncome),
      };
    }),
    grandTotal: toNumber(source.grandTotal),
    excludedTicketsCount: toNumber(source.excludedTicketsCount),
  };
}

function normalizeIncidentTrend(value: unknown, months: number): IncidentTrend {
  const raw = unwrapResponse(value);
  const source = isRecord(raw) ? raw : {};
  const datasets = Array.isArray(source.datasets) ? source.datasets : [];
  const scope = isRecord(source.scope) ? source.scope : {};

  return {
    period: normalizePeriod(source.period, months),
    scope: {
      enterpriseId: typeof scope.enterpriseId === "string" ? scope.enterpriseId : undefined,
      enterpriseName: typeof scope.enterpriseName === "string" ? scope.enterpriseName : undefined,
    },
    labels: toStringArray(source.labels),
    datasets: datasets.map((dataset, index) => {
      const item = isRecord(dataset) ? dataset : {};
      const type = typeof item.type === "string" && item.type.trim() ? item.type : `incident-type-${String(index + 1)}`;

      return {
        type,
        typeLabel: typeof item.typeLabel === "string" && item.typeLabel.trim() ? item.typeLabel : type,
        data: toNumberArray(item.data),
        total: toNumber(item.total),
      };
    }),
    grandTotal: toNumber(source.grandTotal),
  };
}

function normalizeRealtimeBus(value: unknown): RealtimeBusLocation | null {
  if (!isRecord(value)) {
    return null;
  }

  const lat = toNumber(value.lat ?? value.latitude, Number.NaN);
  const lng = toNumber(value.lng ?? value.longitude, Number.NaN);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || typeof value.busId !== "string") {
    return null;
  }

  const nearestStop = isRecord(value.nearestStop)
    ? {
        id: String(value.nearestStop.id ?? ""),
        name: String(value.nearestStop.name ?? ""),
        distance: value.nearestStop.distance != null ? toNumber(value.nearestStop.distance) : undefined,
      }
    : undefined;

  return {
    busId: value.busId,
    plate: typeof value.plate === "string" ? value.plate : value.busId,
    routeId: typeof value.routeId === "string" ? value.routeId : undefined,
    routeName: typeof value.routeName === "string" ? value.routeName : undefined,
    routeCode: typeof value.routeCode === "string" ? value.routeCode : undefined,
    lat,
    lng,
    statusColor: typeof value.statusColor === "string" ? value.statusColor : undefined,
    delayAlert: value.delayAlert === true,
    isFull: value.isFull === true,
    occupancyPercent: value.occupancyPercent != null ? toNumber(value.occupancyPercent) : undefined,
    estimatedMinutesToNextStop:
      value.estimatedMinutesToNextStop != null ? toNumber(value.estimatedMinutesToNextStop) : undefined,
    estimatedMinutesToWaitingStop:
      value.estimatedMinutesToWaitingStop != null ? toNumber(value.estimatedMinutesToWaitingStop) : undefined,
    nearestStop,
    activePassengers: value.activePassengers != null ? toNumber(value.activePassengers) : undefined,
    stopName: typeof value.stopName === "string" ? value.stopName : undefined,
    trackingPath: typeof value.trackingPath === "string" ? value.trackingPath : undefined,
    paymentActionPath: typeof value.paymentActionPath === "string" ? value.paymentActionPath : undefined,
  };
}

function normalizeRealtimeFleet(value: unknown): RealtimeBusLocation[] {
  const raw = unwrapResponse(value);

  if (Array.isArray(raw)) {
    return raw.map(normalizeRealtimeBus).filter((bus): bus is RealtimeBusLocation => bus != null);
  }

  if (isRecord(raw)) {
    const collections = [raw.items, raw.fleet, raw.buses];
    for (const collection of collections) {
      if (Array.isArray(collection)) {
        return collection.map(normalizeRealtimeBus).filter((bus): bus is RealtimeBusLocation => bus != null);
      }
    }

    const singleBus = normalizeRealtimeBus(raw.bus ?? raw);
    return singleBus ? [singleBus] : [];
  }

  return [];
}

function normalizeRealtimeIncident(value: unknown): RealtimeIncident | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.description !== "string") {
    return null;
  }

  return {
    id: value.id,
    busId: typeof value.busId === "string" ? value.busId : "",
    busPlate: typeof value.busPlate === "string" ? value.busPlate : undefined,
    routeId: typeof value.routeId === "string" ? value.routeId : undefined,
    routeName: typeof value.routeName === "string" ? value.routeName : undefined,
    type: typeof value.type === "string" ? value.type : "unknown",
    description: value.description,
    status: typeof value.status === "string" ? value.status : "reported",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
  };
}

function normalizeRealtimeIncidents(value: unknown): RealtimeIncident[] {
  const raw = unwrapResponse(value);

  if (Array.isArray(raw)) {
    return raw.map(normalizeRealtimeIncident).filter((item): item is RealtimeIncident => item != null);
  }

  if (isRecord(raw) && Array.isArray(raw.incidents)) {
    return raw.incidents
      .map(normalizeRealtimeIncident)
      .filter((item): item is RealtimeIncident => item != null);
  }

  return [];
}

function normalizeRealtimeSummary(value: unknown): RealtimeDashboardSummary {
  const raw = unwrapResponse(value);
  const source = isRecord(raw) ? raw : {};

  return {
    totalPassengersInTransit: toNumber(source.totalPassengersInTransit),
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : undefined,
    fullBusAlerts: normalizeRealtimeFleet(source.fullBusAlerts),
    incidents: normalizeRealtimeIncidents(source.incidents),
  };
}

export class DashboardRepository {
  async getPaymentMethodIncome(months: number): Promise<PaymentMethodIncome> {
    const response = await httpMsBussines.get<unknown>(
      ENDPOINTS.DASHBOARD.PAYMENT_METHOD_INCOME,
      { params: { months } },
    );
    return normalizePaymentMethodIncome(response, months);
  }

  async exportPaymentMethodIncome(months: number): Promise<Blob> {
    return await httpMsBussines.get<Blob>(ENDPOINTS.DASHBOARD.PAYMENT_METHOD_INCOME_EXPORT, {
      params: { months },
      responseType: "blob",
    });
  }

  async getIncidentTrend(months: number, enterpriseId?: string): Promise<IncidentTrend> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.DASHBOARD.INCIDENT_TREND, {
      params: { months, ...(enterpriseId ? { enterpriseId } : {}) },
    });
    return normalizeIncidentTrend(response, months);
  }

  async exportIncidentTrend(months: number, enterpriseId?: string): Promise<Blob> {
    return await httpMsBussines.get<Blob>(ENDPOINTS.DASHBOARD.INCIDENT_TREND_EXPORT, {
      params: { months, ...(enterpriseId ? { enterpriseId } : {}) },
      responseType: "blob",
    });
  }

  async getRealtimeFleet(enterpriseId?: string, routeId?: string, stopId?: string): Promise<RealtimeBusLocation[]> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.DASHBOARD.REALTIME.FLEET, {
      params: {
        ...(enterpriseId ? { enterpriseId } : {}),
        ...(routeId ? { routeId } : {}),
        ...(stopId ? { stopId } : {}),
      },
    });
    return normalizeRealtimeFleet(response);
  }

  async getRealtimeSummary(enterpriseId?: string): Promise<RealtimeDashboardSummary> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.DASHBOARD.REALTIME.SUMMARY, {
      params: { ...(enterpriseId ? { enterpriseId } : {}) },
    });
    return normalizeRealtimeSummary(response);
  }

  async getRealtimeBus(busId: string, stopId?: string): Promise<RealtimeBusLocation> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.DASHBOARD.REALTIME.BUS_BY_ID(busId), {
      params: { ...(stopId ? { stopId } : {}) },
    });
    return normalizeRealtimeBus(unwrapResponse(response)) ?? { busId, plate: busId, lat: 0, lng: 0 };
  }

  async getActiveRealtimeIncidents(): Promise<RealtimeIncident[]> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.DASHBOARD.REALTIME.INCIDENTS);
    return normalizeRealtimeIncidents(response);
  }

  async createArrivalNotification(payload: CreateArrivalNotificationDTO): Promise<ArrivalNotificationResponse> {
    return await httpMsBussines.post<ArrivalNotificationResponse>(ENDPOINTS.DASHBOARD.REALTIME.ARRIVAL_NOTIFICATION, payload);
  }
}

export const dashboardRepository = new DashboardRepository();
