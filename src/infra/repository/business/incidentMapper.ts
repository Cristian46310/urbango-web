import type { Incident } from "@/core/domain/entities/business/Incident";

type ApiIncident = Partial<Incident> & {
  createdAt?: string | Date;
  reportedAt?: string | Date;
};

function toIsoDate(value: string | Date | undefined): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function mapIncidentFromApi(raw: ApiIncident): Incident {
  const createdAt = toIsoDate(raw.createdAt ?? raw.reportedAt);
  return {
    id: raw.id ?? "",
    createdAt,
    reportedAt: createdAt,
    type: raw.type ?? "other",
    severity: raw.severity ?? "medium",
    status: raw.status ?? "reported",
    description: raw.description ?? "",
    driver: raw.driver,
    photos: raw.photos,
  };
}

export function mapIncidentsFromApi(items: ApiIncident[]): Incident[] {
  return items.map(mapIncidentFromApi);
}
