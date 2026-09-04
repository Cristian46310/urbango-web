const LAST_TURN_STORAGE_KEY = "urbango.lastTurnSummary";

export interface LastTurnSummary {
  turnId: string;
  busPlate: string;
  startTime: string;
  status: string;
  active?: boolean;
  busId?: string;
  driverId?: string;
  endTime?: string;
}

/** Read cached turn (optional fallback while GET /turn/current loads). */
export function getLastTurnSummary(): LastTurnSummary | null {
  try {
    const raw = localStorage.getItem(LAST_TURN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastTurnSummary;
    return parsed?.turnId ? parsed : null;
  } catch {
    return null;
  }
}

/** @deprecated Prefer getLastTurnSummary */
export function readLastTurnSummary(): LastTurnSummary | null {
  return getLastTurnSummary();
}

export function writeLastTurnSummary(summary: LastTurnSummary) {
  localStorage.setItem(LAST_TURN_STORAGE_KEY, JSON.stringify(summary));
}

export function clearLastTurnSummary() {
  localStorage.removeItem(LAST_TURN_STORAGE_KEY);
}
