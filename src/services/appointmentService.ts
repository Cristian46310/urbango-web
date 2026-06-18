import { httpMsAi } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  Appointment,
  AvailabilityQuery,
  AvailabilityResponse,
  AppointmentsByUserQuery,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "@/core/types/appointments";

export async function getAvailability(
  query?: AvailabilityQuery,
): Promise<AvailabilityResponse> {
  return httpMsAi.get<AvailabilityResponse>(ENDPOINTS.APPOINTMENTS.AVAILABILITY, {
    params: query,
  });
}

export async function listAppointments(): Promise<Appointment[]> {
  return httpMsAi.get<Appointment[]>(ENDPOINTS.APPOINTMENTS.BASE);
}

export async function createAppointment(
  payload: CreateAppointmentRequest,
): Promise<Appointment> {
  return httpMsAi.post<Appointment>(ENDPOINTS.APPOINTMENTS.BASE, payload);
}

export async function getAppointmentsByUser(
  userId: string,
  query?: AppointmentsByUserQuery,
): Promise<Appointment[]> {
  return httpMsAi.get<Appointment[]>(ENDPOINTS.APPOINTMENTS.BY_USER(userId), {
    params: query,
  });
}

export async function getAppointment(id: string): Promise<Appointment> {
  return httpMsAi.get<Appointment>(ENDPOINTS.APPOINTMENTS.BY_ID(id));
}

export async function updateAppointment(
  id: string,
  payload: UpdateAppointmentRequest,
): Promise<Appointment> {
  return httpMsAi.put<Appointment>(ENDPOINTS.APPOINTMENTS.BY_ID(id), payload);
}

export async function deleteAppointment(id: string): Promise<void> {
  return httpMsAi.delete<void>(ENDPOINTS.APPOINTMENTS.BY_ID(id));
}
