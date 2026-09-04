export type PqrsType = "petition" | "complaint" | "claim" | "suggestion";

export type PqrsCategory =
  | "driver"
  | "bus"
  | "route"
  | "card"
  | "technical_support"
  | "other";

export type PqrsStatus = "received" | "in_review" | "in_progress" | "resolved";

export interface PqrsImage {
  id: string;
  pqrs_id: string;
  image_url: string;
  original_name: string;
  mime_type: string;
  size: number;
}

export interface PqrsUpdate {
  id: string;
  pqrs_id: string;
  status_from: PqrsStatus | null;
  status_to: PqrsStatus | null;
  action: string;
  description: string;
  agent_response: string;
  created_at: string;
}

export interface Pqrs {
  id: string;
  ticket_number: string;
  type: PqrsType;
  category: PqrsCategory;
  status: PqrsStatus;
  description: string;
  user_id: string;
  user_email: string;
  estimated_response_at: string | null;
  resolved_at: string | null;
  sla_alert_sent: boolean;
  created_at: string;
  updated_at: string;
  images: PqrsImage[];
  updates: PqrsUpdate[];
}

export interface CreatePqrsImageRequest {
  filename: string;
  mime_type: string;
  content_base64: string;
}

/** Payload listo para el API (snake_case). Preferir createPqrs() con Files. */
export interface CreatePqrsRequest {
  type: PqrsType;
  description: string;
  user_id: string;
  user_email: string;
  category?: PqrsCategory;
  images?: CreatePqrsImageRequest[];
}

export interface CreatePqrsInput {
  type: PqrsType;
  description: string;
  userId: string;
  userEmail: string;
  category?: PqrsCategory;
  images?: File[];
}

export interface UpdatePqrsRequest {
  type?: PqrsType | null;
  category?: PqrsCategory | null;
  description?: string | null;
  user_email?: string | null;
}

export interface CreatePqrsUpdateRequest {
  status_to: PqrsStatus;
  description?: string;
  agent_response?: string;
  action?: string;
}

export interface ListPqrsQuery {
  status?: PqrsStatus;
  category?: PqrsCategory;
  user_email?: string;
}
