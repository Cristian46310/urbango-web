import { useCallback, useEffect, useState } from "react";

import type { MassAlert, MassAlertPayload, MassAlertStats } from "@/core/types/alerts";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  createMassAlert,
  getMassAlertStats,
  getMassAlerts,
  previewMassAlertRecipients,
} from "@/services/alertService";

export function useMassAlerts() {
  const [alerts, setAlerts] = useState<MassAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const loadMassAlerts = useCallback(async (pageToLoad = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMassAlerts({ page: pageToLoad, limit: 10 });
      setAlerts(response.items);
      setPage(response.meta.page);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudieron cargar las alertas masivas");
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const previewRecipients = useCallback(async (payload: MassAlertPayload) => {
    setPreviewLoading(true);
    setPreviewCount(null);
    try {
      const response = await previewMassAlertRecipients(payload);
      setPreviewCount(response.count);
      return response.count;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudo calcular los destinatarios");
      showErrorToast(message);
      return null;
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const sendMassAlert = useCallback(
    async (payload: MassAlertPayload) => {
      setSending(true);
      try {
        const created = await createMassAlert(payload);
        showSuccessToast(
          created.status === "scheduled"
            ? "Alerta programada correctamente"
            : "Alerta enviada correctamente",
        );
        setPreviewCount(null);
        await loadMassAlerts(1);
        return created;
      } catch (err) {
        showErrorToast(getApiErrorMessage(err, "No se pudo enviar la alerta"));
        return null;
      } finally {
        setSending(false);
      }
    },
    [loadMassAlerts],
  );

  const fetchStats = useCallback(async (alertId: string): Promise<MassAlertStats | null> => {
    try {
      return await getMassAlertStats(alertId);
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudieron cargar las estadísticas"));
      return null;
    }
  }, []);

  useEffect(() => {
    void loadMassAlerts(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    alerts,
    loading,
    previewLoading,
    sending,
    error,
    page,
    totalPages,
    totalItems,
    previewCount,
    setPage,
    loadMassAlerts,
    previewRecipients,
    sendMassAlert,
    fetchStats,
    clearPreview: () => { setPreviewCount(null); },
  };
}
