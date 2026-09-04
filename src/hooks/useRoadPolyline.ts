import { useEffect, useMemo, useState } from "react";

import {
  normalizeLatLng,
  resolveRoutePolyline,
  type LatLngTuple,
} from "@/services/osrmRouteService";

type UseRoadPolylineResult = {
  positions: LatLngTuple[];
  usedRoads: boolean;
  loading: boolean;
};

function sanitizeWaypoints(waypoints: LatLngTuple[]): LatLngTuple[] {
  const cleaned: LatLngTuple[] = [];
  for (const point of waypoints) {
    const normalized = normalizeLatLng(point?.[0], point?.[1]);
    if (normalized) cleaned.push(normalized);
  }
  return cleaned;
}

/**
 * Debounced OSRM polyline for a list of [lat, lng] waypoints.
 * Falls back to straight segments if routing fails.
 */
export function useRoadPolyline(
  waypoints: LatLngTuple[],
  debounceMs = 280,
): UseRoadPolylineResult {
  // Stabilize on coordinate values (not array identity) so parent re-renders don't retrigger fetch.
  const waypointKey = useMemo(
    () =>
      sanitizeWaypoints(waypoints)
        .map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`)
        .join("|"),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: key from values
    [
      waypoints
        .map((p) => `${String(p?.[0])},${String(p?.[1])}`)
        .join("|"),
    ],
  );

  const straight = useMemo(() => {
    if (!waypointKey) return [] as LatLngTuple[];
    return waypointKey.split("|").map((pair) => {
      const [lat, lng] = pair.split(",").map(Number);
      return [lat, lng] as LatLngTuple;
    });
  }, [waypointKey]);

  const [positions, setPositions] = useState<LatLngTuple[]>(straight);
  const [usedRoads, setUsedRoads] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (straight.length < 2) {
      setPositions(straight);
      setUsedRoads(false);
      setLoading(false);
      return;
    }

    setPositions(straight);
    setUsedRoads(false);
    setLoading(true);

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await resolveRoutePolyline(straight, controller.signal);
          if (controller.signal.aborted) return;
          setPositions(result.positions);
          setUsedRoads(result.usedRoads);
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          if (!controller.signal.aborted) {
            setPositions(straight);
            setUsedRoads(false);
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      })();
    }, debounceMs);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [waypointKey, debounceMs, straight]);

  return { positions, usedRoads, loading };
}
