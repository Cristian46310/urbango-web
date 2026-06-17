import { useCallback, useEffect, useState } from "react";

import type {
  Appointment,
  AvailabilityResponse,
  CreateAppointmentRequest,
} from "@/core/types/appointments";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  createAppointment,
  deleteAppointment,
  getAppointmentsByUser,
  getAvailability,
} from "@/services/appointmentService";

export function useAppointments(userId: string | null) {
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadMyAppointments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getAppointmentsByUser(userId);
      setMyAppointments(data);
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudieron cargar tus citas"));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadAvailability = useCallback(async (days = 10) => {
    setAvailabilityLoading(true);
    try {
      const data = await getAvailability({ days });
      setAvailability(data);
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo cargar la disponibilidad"));
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  const create = useCallback(
    async (payload: CreateAppointmentRequest): Promise<Appointment | null> => {
      setCreating(true);
      try {
        const appointment = await createAppointment(payload);
        setMyAppointments((prev) => [appointment, ...prev]);
        showSuccessToast("Cita agendada exitosamente");
        return appointment;
      } catch (err) {
        showErrorToast(getApiErrorMessage(err, "No se pudo agendar la cita"));
        return null;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  const cancel = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteAppointment(id);
        setMyAppointments((prev) => prev.filter((a) => a.id !== id));
        showSuccessToast("Cita cancelada");
        return true;
      } catch (err) {
        showErrorToast(getApiErrorMessage(err, "No se pudo cancelar la cita"));
        return false;
      }
    },
    [],
  );

  useEffect(() => {
    void loadMyAppointments();
  }, [loadMyAppointments]);

  return {
    myAppointments,
    availability,
    loading,
    availabilityLoading,
    creating,
    loadMyAppointments,
    loadAvailability,
    create,
    cancel,
  };
}
