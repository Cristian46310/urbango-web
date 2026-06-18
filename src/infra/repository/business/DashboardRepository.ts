import { httpMsBussines } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { IncidentTrend, PaymentMethodIncome, RealtimeBusLocation, RealtimeIncident, CreateArrivalNotificationDTO, ArrivalNotificationResponse } from "@/core/domain/entities/business";

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

  async getRealtimeFleet(enterpriseId?: string, routeId?: string): Promise<RealtimeBusLocation[]> {
    return await httpMsBussines.get<RealtimeBusLocation[]>(ENDPOINTS.DASHBOARD.REALTIME.FLEET, {
      params: { ...(enterpriseId ? { enterpriseId } : {}), ...(routeId ? { routeId } : {}) },
    });
  }

  async getRealtimeBus(busId: string): Promise<RealtimeBusLocation> {
    return await httpMsBussines.get<RealtimeBusLocation>(ENDPOINTS.DASHBOARD.REALTIME.BUS_BY_ID(busId));
  }

  async getActiveRealtimeIncidents(): Promise<RealtimeIncident[]> {
    return await httpMsBussines.get<RealtimeIncident[]>(ENDPOINTS.DASHBOARD.REALTIME.INCIDENTS);
  }

  async createArrivalNotification(payload: CreateArrivalNotificationDTO): Promise<ArrivalNotificationResponse> {
    return await httpMsBussines.post<ArrivalNotificationResponse>(ENDPOINTS.DASHBOARD.REALTIME.ARRIVAL_NOTIFICATION, payload);
  }
}

export const dashboardRepository = new DashboardRepository();
