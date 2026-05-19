import { httpMsBussines } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { IncidentTrend, PaymentMethodIncome } from "@/core/domain/entities/business";

export class DashboardRepository {
  async getPaymentMethodIncome(months: number): Promise<PaymentMethodIncome> {
    return await httpMsBussines.get<PaymentMethodIncome>(
      ENDPOINTS.DASHBOARD.PAYMENT_METHOD_INCOME,
      { params: { months } },
    );
  }

  async exportPaymentMethodIncome(months: number): Promise<Blob> {
    return await httpMsBussines.get<Blob>(ENDPOINTS.DASHBOARD.PAYMENT_METHOD_INCOME_EXPORT, {
      params: { months },
      responseType: "blob",
    });
  }

  async getIncidentTrend(months: number, enterpriseId?: string): Promise<IncidentTrend> {
    return await httpMsBussines.get<IncidentTrend>(ENDPOINTS.DASHBOARD.INCIDENT_TREND, {
      params: { months, ...(enterpriseId ? { enterpriseId } : {}) },
    });
  }

  async exportIncidentTrend(months: number, enterpriseId?: string): Promise<Blob> {
    return await httpMsBussines.get<Blob>(ENDPOINTS.DASHBOARD.INCIDENT_TREND_EXPORT, {
      params: { months, ...(enterpriseId ? { enterpriseId } : {}) },
      responseType: "blob",
    });
  }
}

export const dashboardRepository = new DashboardRepository();
