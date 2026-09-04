import { useCallback, useEffect, useRef, useState } from "react";

import type { WeatherTickerData } from "@/core/types/weather";
import { assessWeather } from "@/services/weatherService";

export type WeatherTickerStatus =
  | "locating"
  | "ready"
  | "denied"
  | "unavailable"
  | "hidden";

const REFRESH_INTERVAL_MS = 20 * 60 * 1000; // 20 minutos

function getCurrentTravelHour(): number {
  return new Date().getHours();
}

function isPermissionDenied(error: unknown): boolean {
  if (typeof GeolocationPositionError !== "undefined" && error instanceof GeolocationPositionError) {
    return error.code === error.PERMISSION_DENIED;
  }
  if (error && typeof error === "object" && "code" in error) {
    return (error as { code: number }).code === 1;
  }
  if (error instanceof Error) {
    return /permiso|denied|deneg/i.test(error.message);
  }
  return false;
}

function getCurrentPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error),
      {
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 60_000,
      },
    );
  });
}

export function useWeatherTicker() {
  const [status, setStatus] = useState<WeatherTickerStatus>("locating");
  const [data, setData] = useState<WeatherTickerData | null>(null);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const hasDataRef = useRef(false);

  const fetchWeather = useCallback(async (opts?: { showLocating?: boolean }) => {
    const fetchId = ++fetchIdRef.current;
    const showLocating = opts?.showLocating ?? !hasDataRef.current;

    if (showLocating) {
      setStatus("locating");
    }

    try {
      const coords = await getCurrentPosition();
      if (!mountedRef.current || fetchId !== fetchIdRef.current) return;

      const assessment = await assessWeather({
        lat: coords.latitude,
        lon: coords.longitude,
        travel_hour: getCurrentTravelHour(),
      });

      if (!mountedRef.current || fetchId !== fetchIdRef.current) return;

      hasDataRef.current = true;
      setData(assessment);
      setStatus("ready");
    } catch (error) {
      if (!mountedRef.current || fetchId !== fetchIdRef.current) return;

      if (isPermissionDenied(error)) {
        hasDataRef.current = false;
        setData(null);
        setStatus("denied");
        return;
      }

      // Conservar último snapshot si el refresh falla
      if (hasDataRef.current) return;

      setStatus("unavailable");
    }
  }, []);

  const retry = useCallback(() => {
    void fetchWeather({ showLocating: true });
  }, [fetchWeather]);

  useEffect(() => {
    mountedRef.current = true;
    void fetchWeather({ showLocating: true });

    const intervalId = window.setInterval(() => {
      void fetchWeather({ showLocating: false });
    }, REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [fetchWeather]);

  return { status, data, retry };
}
