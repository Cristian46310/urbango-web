import type { Incident, IncidentPhoto } from "@/core/domain/entities/business/Incident";

type ApiIncidentPhoto = {
  id?: string;
  url?: string;
  publicUrl?: string;
  photoUrl?: string;
  public_url?: string;
  photo_url?: string;
  originalName?: string;
  original_name?: string;
};

type ApiIncident = Partial<Incident> & {
  createdAt?: string | Date;
  reportedAt?: string | Date;
  busId?: string;
  bus_id?: string;
  busPlate?: string;
  bus_plate?: string;
  routeName?: string;
  route_name?: string;
  bus?: { id?: string; plate?: string; placa?: string };
  photos?: ApiIncidentPhoto[];
};

function toIsoDate(value: string | Date | undefined): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function pickPhotoUrl(raw: ApiIncidentPhoto): string | undefined {
  const candidate =
    raw.publicUrl
    ?? raw.photoUrl
    ?? raw.url
    ?? raw.public_url
    ?? raw.photo_url;
  if (typeof candidate !== "string") return undefined;
  const trimmed = candidate.trim();
  return trimmed || undefined;
}

function mapPhoto(raw: ApiIncidentPhoto): IncidentPhoto | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  if (!id) return null;
  const url = pickPhotoUrl(raw);
  return {
    id,
    url,
    publicUrl: url,
    originalName: raw.originalName ?? raw.original_name,
  };
}

export function mapIncidentFromApi(raw: ApiIncident): Incident {
  const createdAt = toIsoDate(raw.createdAt ?? raw.reportedAt);
  const busId = raw.busId ?? raw.bus_id ?? raw.bus?.id;
  const plate =
    raw.bus?.plate
    ?? raw.bus?.placa
    ?? raw.busPlate
    ?? raw.bus_plate;
  const routeName = raw.routeName ?? raw.route_name;

  return {
    id: raw.id ?? "",
    createdAt,
    reportedAt: createdAt,
    type: raw.type ?? "other",
    severity: raw.severity ?? "medium",
    status: raw.status ?? "reported",
    description: raw.description ?? "",
    busId,
    bus: busId || plate || routeName
      ? { id: busId, plate, routeName }
      : undefined,
    driver: raw.driver,
    photos: Array.isArray(raw.photos)
      ? raw.photos
          .map(mapPhoto)
          .filter((photo): photo is IncidentPhoto => photo !== null)
      : undefined,
  };
}

export function mapIncidentsFromApi(items: ApiIncident[]): Incident[] {
  return items.map(mapIncidentFromApi);
}
