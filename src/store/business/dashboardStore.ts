import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast } from "@/lib/toast";
import type { IncidentTrend, PaymentMethodIncome } from "@/core/domain/entities/business";
import { dashboardRepository } from "@/infra/repository/business/DashboardRepository";

export const useDashboardStore = create<{
  paymentIncome: PaymentMethodIncome | null;
  incidentTrend: IncidentTrend | null;
  loading: boolean;
  error: string | null;
  fetchPaymentIncome: (months: number) => Promise<PaymentMethodIncome>;
  fetchIncidentTrend: (months: number, enterpriseId?: string) => Promise<IncidentTrend>;
  exportPaymentIncome: (months: number) => Promise<void>;
  exportIncidentTrend: (months: number, enterpriseId?: string) => Promise<void>;
}>((set) => ({
  paymentIncome: null,
  incidentTrend: null,
  loading: false,
  error: null,
  fetchPaymentIncome: async (months) => {
    const loadingToastId = showLoadingToast("Cargando ingresos...");
    set({ loading: true, error: null });
    try {
      const data = await dashboardRepository.getPaymentMethodIncome(months);
      set({ loading: false, paymentIncome: data });
      return data;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  fetchIncidentTrend: async (months, enterpriseId) => {
    const loadingToastId = showLoadingToast("Cargando tendencia...");
    set({ loading: true, error: null });
    try {
      const data = await dashboardRepository.getIncidentTrend(months, enterpriseId);
      set({ loading: false, incidentTrend: data });
      return data;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  exportPaymentIncome: async (months) => {
    const blob = await dashboardRepository.exportPaymentMethodIncome(months);
    downloadBlob(blob, `ingresos-metodos-pago-${String(months)}m.csv`);
  },
  exportIncidentTrend: async (months, enterpriseId) => {
    const blob = await dashboardRepository.exportIncidentTrend(months, enterpriseId);
    downloadBlob(blob, `incidentes-por-tipo-${String(months)}m.csv`);
  },
}));

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
