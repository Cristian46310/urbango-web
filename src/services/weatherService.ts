import { httpMsAi } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  WeatherAlert,
  CreateWeatherAlertRequest,
  UpdateWeatherAlertRequest,
  ForecastHour,
  WeatherAssessRequest,
  WeatherAssessResponse,
  WeatherRiskLevel,
  WeatherTickerData,
} from "@/core/types/weather";

function normalizeRiskLevel(value: string | undefined): WeatherRiskLevel {
  const normalized = (value ?? "").trim().toLowerCase();
  if (
    normalized === "high" ||
    normalized === "alto" ||
    normalized === "alta" ||
    normalized.includes("high") ||
    normalized.includes("alto")
  ) {
    return "high";
  }
  if (
    normalized === "medium" ||
    normalized === "medio" ||
    normalized === "media" ||
    normalized === "moderate" ||
    normalized === "moderado" ||
    normalized.includes("medium") ||
    normalized.includes("medio") ||
    normalized.includes("moderate")
  ) {
    return "medium";
  }
  return "low";
}

function normalizeRainProbability(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function mapWeatherAssessToTicker(
  response: WeatherAssessResponse,
): WeatherTickerData {
  const rainProbability = normalizeRainProbability(
    response.metrics?.rain_probability,
  );
  const riskLevel = normalizeRiskLevel(response.risk_level);
  const recommendation =
    typeof response.recommendation === "string" && response.recommendation.trim()
      ? response.recommendation.trim()
      : "Sin recomendación disponible";
  const explanation =
    typeof response.explanation === "string" && response.explanation.trim()
      ? response.explanation.trim()
      : undefined;

  return { rainProbability, riskLevel, recommendation, explanation };
}

export async function createWeatherAlert(
  payload: CreateWeatherAlertRequest,
): Promise<WeatherAlert> {
  return httpMsAi.post<WeatherAlert>(ENDPOINTS.WEATHER.ALERTS, payload);
}

export async function listWeatherAlertsByUser(userId: string): Promise<WeatherAlert[]> {
  return httpMsAi.get<WeatherAlert[]>(ENDPOINTS.WEATHER.ALERTS_BY_USER(userId));
}

export async function getWeatherAlert(alertId: string): Promise<WeatherAlert> {
  return httpMsAi.get<WeatherAlert>(ENDPOINTS.WEATHER.ALERT_BY_ID(alertId));
}

export async function updateWeatherAlert(
  alertId: string,
  payload: UpdateWeatherAlertRequest,
): Promise<WeatherAlert> {
  return httpMsAi.put<WeatherAlert>(ENDPOINTS.WEATHER.ALERT_BY_ID(alertId), payload);
}

export async function deactivateWeatherAlert(alertId: string): Promise<void> {
  return httpMsAi.delete<void>(ENDPOINTS.WEATHER.ALERT_BY_ID(alertId));
}

export async function listAvailableForecastHours(
  lat: number,
  lon: number,
): Promise<ForecastHour[]> {
  return httpMsAi.get<ForecastHour[]>(ENDPOINTS.WEATHER.FORECAST_HOURS, {
    params: { lat, lon },
  });
}

export async function assessWeather(
  payload: WeatherAssessRequest,
): Promise<WeatherTickerData> {
  const response = await httpMsAi.post<WeatherAssessResponse>(
    ENDPOINTS.WEATHER.ASSESS,
    payload,
  );
  return mapWeatherAssessToTicker(response);
}
