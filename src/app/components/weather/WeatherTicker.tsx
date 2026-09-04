import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WeatherRiskLevel, WeatherTickerData } from "@/core/types/weather";
import { useWeatherTicker } from "@/hooks/weather/useWeatherTicker";
import { cn } from "@/lib/utils";

const RESUME_DELAY_MS = 4000;

const RISK_LABEL: Record<WeatherRiskLevel, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};

const RISK_ICON: Record<WeatherRiskLevel, string> = {
  low: "☀️",
  medium: "🌦️",
  high: "⛈️",
};

const RISK_BAR_CLASS: Record<WeatherRiskLevel, string> = {
  low: "bg-sky-100/95 text-sky-950 border-sky-200/80 dark:bg-sky-950/70 dark:text-sky-50 dark:border-sky-800/60",
  medium:
    "bg-amber-100/95 text-amber-950 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-50 dark:border-amber-800/50",
  high: "bg-orange-100/95 text-orange-950 border-orange-200/80 dark:bg-orange-950/55 dark:text-orange-50 dark:border-orange-800/50",
};

function buildTickerMessage(data: WeatherTickerData): string {
  const parts = [
    `${RISK_ICON[data.riskLevel]} Probabilidad de lluvia: ${data.rainProbability}%`,
    `Riesgo: ${RISK_LABEL[data.riskLevel]}`,
    data.recommendation,
  ];
  if (data.explanation) {
    parts.push(data.explanation);
  }
  return parts.join(" · ");
}

function StaticTickerRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative z-0 flex h-11 w-full shrink-0 items-center gap-3 border-b px-4 text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ScrollingTicker({
  message,
  riskLevel,
}: {
  message: string;
  riskLevel: WeatherRiskLevel;
}) {
  const [paused, setPaused] = useState(false);
  const resumeTimerRef = useRef<number | null>(null);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current != null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    clearResumeTimer();
    setPaused(true);
  }, [clearResumeTimer]);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = window.setTimeout(() => {
      setPaused(false);
      resumeTimerRef.current = null;
    }, RESUME_DELAY_MS);
  }, [clearResumeTimer]);

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={cn(
        "weather-ticker relative z-0 h-11 w-full shrink-0 overflow-hidden border-b",
        RISK_BAR_CLASS[riskLevel],
      )}
      onMouseEnter={pause}
      onMouseLeave={scheduleResume}
      onTouchStart={pause}
      onTouchEnd={scheduleResume}
    >
      <div
        className={cn(
          "weather-ticker-track absolute inset-y-0 left-0 flex items-center whitespace-nowrap text-sm",
          paused && "weather-ticker-track--paused",
        )}
      >
        <span className="px-6">{message}</span>
        <span className="px-6" aria-hidden="true">
          {message}
        </span>
      </div>
    </div>
  );
}

export function WeatherTicker() {
  const { status, data, retry } = useWeatherTicker();

  if (status === "hidden") {
    return null;
  }

  if (status === "locating") {
    return (
      <StaticTickerRow className="border-(--security-border) bg-slate-100/90 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
        <Loader2 className="size-3.5 shrink-0 animate-spin opacity-70" aria-hidden />
        <span>Obteniendo tu ubicación para mostrarte el clima...</span>
      </StaticTickerRow>
    );
  }

  if (status === "denied") {
    return (
      <StaticTickerRow className="border-(--security-border) bg-slate-100/90 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
        <span className="min-w-0 flex-1 truncate">
          Activa tu ubicación para ver el clima de tu zona
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 px-2.5 text-xs"
          onClick={retry}
        >
          Reintentar
        </Button>
      </StaticTickerRow>
    );
  }

  if (status === "unavailable" || !data) {
    return (
      <StaticTickerRow className="border-(--security-border) bg-slate-50/90 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
        <span>Clima no disponible en este momento</span>
      </StaticTickerRow>
    );
  }

  return <ScrollingTicker message={buildTickerMessage(data)} riskLevel={data.riskLevel} />;
}
