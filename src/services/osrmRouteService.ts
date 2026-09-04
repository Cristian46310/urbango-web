/**
 * Road-following polyline via OSRM.
 * Visual only — does not change saved haversine distances / API payloads.
 *
 * Override base URL with VITE_OSRM_URL (default: public demo server).
 */

export type LatLngTuple = [number, number]; // [lat, lng]

type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][]; // [lng, lat]
    };
  }>;
};

const DEFAULT_OSRM_BASE = "https://router.project-osrm.org";

function getOsrmBaseUrl(): string {
  const configured = (import.meta.env.VITE_OSRM_URL as string | undefined)?.trim();
  return (configured || DEFAULT_OSRM_BASE).replace(/\/+$/, "");
}

/** Coerce API values that may arrive as strings. */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function normalizeLatLng(
  lat: unknown,
  lng: unknown,
): LatLngTuple | null {
  const safeLat = toFiniteNumber(lat);
  const safeLng = toFiniteNumber(lng);
  if (safeLat == null || safeLng == null) return null;
  if (safeLat < -90 || safeLat > 90 || safeLng < -180 || safeLng > 180) {
    return null;
  }
  return [safeLat, safeLng];
}

function straightFallback(waypoints: LatLngTuple[]): LatLngTuple[] {
  return waypoints.map(([lat, lng]) => [lat, lng]);
}

/**
 * Fetch a driving route through the given waypoints (order preserved).
 * Returns null on failure so callers can fall back to a straight polyline.
 */
export async function fetchDrivingRoute(
  waypoints: LatLngTuple[],
  signal?: AbortSignal,
): Promise<LatLngTuple[] | null> {
  if (waypoints.length < 2) {
    return waypoints.length === 1 ? [waypoints[0]] : [];
  }

  // OSRM path: lng,lat;lng,lat;...
  const coords = waypoints
    .map(([lat, lng]) => `${lng},${lat}`)
    .join(";");

  const url = `${getOsrmBaseUrl()}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, {
      method: "GET",
      signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as OsrmRouteResponse;
    if (data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates?.length) {
      return null;
    }

    // GeoJSON → Leaflet [lat, lng]
    const positions: LatLngTuple[] = [];
    for (const pair of data.routes[0].geometry.coordinates) {
      const normalized = normalizeLatLng(pair[1], pair[0]);
      if (normalized) positions.push(normalized);
    }
    return positions.length >= 2 ? positions : null;
  } catch {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    return null;
  }
}

/**
 * Resolve display positions: road geometry when possible, else straight segments.
 */
export async function resolveRoutePolyline(
  waypoints: LatLngTuple[],
  signal?: AbortSignal,
): Promise<{ positions: LatLngTuple[]; usedRoads: boolean }> {
  const cleaned = waypoints
    .map(([lat, lng]) => normalizeLatLng(lat, lng))
    .filter((point): point is LatLngTuple => point != null);

  if (cleaned.length < 2) {
    return { positions: cleaned, usedRoads: false };
  }

  const road = await fetchDrivingRoute(cleaned, signal);
  if (road && road.length >= 2) {
    return { positions: road, usedRoads: true };
  }

  return { positions: straightFallback(cleaned), usedRoads: false };
}
