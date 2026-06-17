import { useCallback, useEffect, useState } from "react";

import type { Appointment, UpdateAppointmentRequest } from "@/core/types/appointments";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  deleteAppointment,
  listAppointments,
  updateAppointment,
} from "@/services/appointmentService";

export function useAppointmentsAdmin() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAppointments();
      setAppointments(data);
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudieron cargar las citas"));
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(
    async (id: string, payload: UpdateAppointmentRequest): Promise<boolean> => {
      setUpdating(true);
      try {
        const updated = await updateAppointment(id, payload);
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updated } : a)),
        );
        showSuccessToast("Cita actualizada");
        return true;
      } catch (err) {
        showErrorToast(getApiErrorMessage(err, "No se pudo actualizar la cita"));
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      showSuccessToast("Cita eliminada");
      return true;
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo eliminar la cita"));
      return false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    appointments,
    loading,
    updating,
    load,
    update,
    remove,
  };
}
