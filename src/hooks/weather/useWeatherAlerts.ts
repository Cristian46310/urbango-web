import { useCallback, useEffect, useState } from "react";

import type {
  CreateWeatherAlertRequest,
  UpdateWeatherAlertRequest,
  WeatherAlert,
} from "@/core/types/weather";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  createWeatherAlert,
  deactivateWeatherAlert,
  listWeatherAlertsByUser,
  updateWeatherAlert,
} from "@/services/weatherService";

export function useWeatherAlerts(userId: string | null) {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await listWeatherAlertsByUser(userId);
      setAlerts(data);
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudieron cargar las alertas de clima"));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const create = useCallback(
    async (payload: CreateWeatherAlertRequest): Promise<WeatherAlert | null> => {
      setSaving(true);
      try {
        const alert = await createWeatherAlert(payload);
        setAlerts((prev) => [alert, ...prev]);
        showSuccessToast("Preferencia de clima guardada");
        return alert;
      } catch (err) {
        showErrorToast(getApiErrorMessage(err, "No se pudo crear la alerta de clima"));
        return null;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const update = useCallback(
    async (alertId: string, payload: UpdateWeatherAlertRequest): Promise<boolean> => {
      setSaving(true);
      try {
        const updated = await updateWeatherAlert(alertId, payload);
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, ...updated } : a)),
        );
        showSuccessToast("Preferencia de clima actualizada");
        return true;
      } catch (err) {
        showErrorToast(getApiErrorMessage(err, "No se pudo actualizar la alerta de clima"));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const deactivate = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      await deactivateWeatherAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_active: false } : a)),
      );
      showSuccessToast("Alerta de clima desactivada");
      return true;
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo desactivar la alerta"));
      return false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    alerts,
    loading,
    saving,
    load,
    create,
    update,
    deactivate,
  };
}
