import { httpMsAi } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  WeatherAlert,
  CreateWeatherAlertRequest,
  UpdateWeatherAlertRequest,
  ForecastHour,
} from "@/core/types/weather";

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
