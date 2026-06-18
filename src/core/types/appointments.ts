export type AppointmentType = "virtual" | "in_person";

export type AppointmentReason = "credit_card" | "complaint" | "refund" | "other";

export interface Slot {
  start: string;
  end: string;
}

export interface AvailabilityResponse {
  slots: Slot[];
}

export interface Appointment {
  id: string;
  calendar_event_id: string | null;
  type: AppointmentType;
  reason: AppointmentReason;
  date_time: string;
  description: string;
  location: string;
  user_id: string;
  user_email: string;
  created_at: string;
}

export interface CreateAppointmentRequest {
  type: AppointmentType;
  reason: AppointmentReason;
  date_time: string;
  description?: string;
  user_id: string;
  user_email: string;
}

export interface UpdateAppointmentRequest {
  type?: AppointmentType | null;
  reason?: AppointmentReason | null;
  date_time?: string | null;
  description?: string | null;
}

export interface AvailabilityQuery {
  days?: number;
  start_date?: string;
}

export interface AppointmentsByUserQuery {
  start_date?: string;
  end_date?: string;
}
