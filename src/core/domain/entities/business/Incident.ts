export type IncidentType = "mechanical" | "accident" | "delay" | "passenger" | "other";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "reported" | "in_review" | "closed";

export interface Incident {
  id: string;
  createdAt: string;
  /** Alias de `createdAt` para tablas que usan fecha de reporte. */
  reportedAt: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  driver?: { id?: string; name?: string };
  photos?: { id: string; url?: string }[];
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

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: "Reportado",
  in_review: "En revisión",
  closed: "Cerrado",
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

export function formatIncidentDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
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
