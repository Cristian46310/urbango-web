export type IncidentType = "mechanical" | "accident" | "delay" | "passenger" | "other";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "reported" | "in_review" | "closed";

export interface IncidentPhoto {
  id: string;
  url?: string;
  publicUrl?: string;
  originalName?: string;
}

export interface Incident {
  id: string;
  createdAt: string;
  /** Alias de `createdAt` para tablas que usan fecha de reporte. */
  reportedAt: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  busId?: string;
  bus?: { id?: string; plate?: string; routeName?: string };
  driver?: { id?: string; name?: string };
  photos?: IncidentPhoto[];
}

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  mechanical: "Mecánico",
  accident: "Accidente",
  delay: "Retraso",
  passenger: "Pasajero",
  other: "Otro",
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

export const INCIDENT_SEVERITY_OPTIONS: IncidentSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export const INCIDENT_SEVERITY_RANK: Record<IncidentSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: "Abierto",
  in_review: "En revisión",
  closed: "Resuelto",
};

export const INCIDENT_TYPE_OPTIONS: IncidentType[] = [
  "mechanical",
  "accident",
  "delay",
  "passenger",
  "other",
];

export const INCIDENT_STATUS_OPTIONS: IncidentStatus[] = [
  "reported",
  "in_review",
  "closed",
];

/** Flujo sugerido de estados (API: reported → in_review → closed). */
export const INCIDENT_STATUS_FLOW: IncidentStatus[] = [
  "reported",
  "in_review",
  "closed",
];

export function formatIncidentDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

/** Fecha legible tipo "28 de julio, 14:35". */
export function formatIncidentDateLong(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const datePart = date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });
  const timePart = date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart}, ${timePart}`;
}

/**
 * Radicado legible a partir del UUID (la API no expone número de radicado).
 * Ej.: "#INC-2026-A1B2C3"
 */
export function formatIncidentRadicado(
  id: string | undefined,
  reportedAt?: string,
): string {
  if (!id) return "—";
  const yearSource = reportedAt ? new Date(reportedAt) : new Date();
  const year = Number.isNaN(yearSource.getTime())
    ? new Date().getFullYear()
    : yearSource.getFullYear();
  const short = id.replace(/-/g, "").slice(-6).toUpperCase();
  return `#INC-${year}-${short}`;
}

export function incidentTypeLabel(type: string): string {
  return INCIDENT_TYPE_LABELS[type as IncidentType] ?? type;
}

export function incidentSeverityLabel(severity: string): string {
  return INCIDENT_SEVERITY_LABELS[severity as IncidentSeverity] ?? severity;
}

export function incidentStatusLabel(status: string): string {
  return INCIDENT_STATUS_LABELS[status as IncidentStatus] ?? status;
}

export function truncateText(value: string, max = 60): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}...`;
}
