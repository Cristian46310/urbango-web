import { useCallback, useEffect, useState } from "react";

import type { UserAlert } from "@/core/types/alerts";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast } from "@/lib/toast";
import {
  getAlertById,
  getAlerts,
  markAlertAsRead,
} from "@/services/alertService";

export function useAlerts(enabled = true) {
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadAlerts = useCallback(
    async (pageToLoad = page, unreadOnly = false) => {
      if (!enabled) return;

      setLoading(true);
      setError(null);
      try {
        const response = await getAlerts({ page: pageToLoad, limit: 20, unreadOnly });
        setAlerts(response.items);
        setPage(response.meta.page);
        setTotalPages(response.meta.totalPages);
        setTotalItems(response.meta.totalItems);
      } catch (err) {
        const message = getApiErrorMessage(err, "No se pudieron cargar las alertas");
        setError(message);
        showErrorToast(message);
      } finally {
        setLoading(false);
      }
    },
    [enabled, page],
  );

  const openAlert = useCallback(async (alertId: string) => {
    try {
      const alert = await getAlertById(alertId);
      setAlerts((prev) =>
        prev.map((item) => (item.id === alertId ? { ...item, ...alert } : item)),
      );
      return alert;
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo abrir la alerta"));
      return null;
    }
  }, []);

  const readAlert = useCallback(async (alertId: string) => {
    try {
      const alert = await markAlertAsRead(alertId);
      setAlerts((prev) =>
        prev.map((item) => (item.id === alertId ? { ...item, ...alert, isRead: true } : item)),
      );
      return alert;
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo marcar como leída"));
      return null;
    }
  }, []);

  const prependAlert = useCallback((alert: UserAlert) => {
    setAlerts((prev) => {
      if (prev.some((item) => item.id === alert.id)) {
        return prev.map((item) => (item.id === alert.id ? { ...item, ...alert } : item));
      }
      return [alert, ...prev];
    });
  }, []);

  useEffect(() => {
    void loadAlerts(1);
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    alerts,
    loading,
    error,
    page,
    totalPages,
    totalItems,
    setPage,
    loadAlerts,
    openAlert,
    readAlert,
    prependAlert,
  };
}
