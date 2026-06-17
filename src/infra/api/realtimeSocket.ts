const DEFAULT_REALTIME_NAMESPACE = "/dashboard/realtime";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function toHttpScheme(baseUrl: string): string {
  if (baseUrl.startsWith("wss://")) {
    return baseUrl.replace(/^wss:\/\//, "https://");
  }

  if (baseUrl.startsWith("ws://")) {
    return baseUrl.replace(/^ws:\/\//, "http://");
  }

  return baseUrl;
}

function stripNamespace(baseUrl: string, namespace: string): string {
  return baseUrl.endsWith(namespace)
    ? baseUrl.slice(0, -namespace.length)
    : baseUrl;
}

export interface RealtimeSocketConfig {
  origin: string;
  namespace: string;
  url: string;
}

export function buildRealtimeSocketConfig(namespace = DEFAULT_REALTIME_NAMESPACE): RealtimeSocketConfig | null {
  const configuredUrl = (import.meta.env.VITE_URL_MS_BUSSINES_WS as string | undefined)?.trim();
  const fallbackHttpUrl = (import.meta.env.VITE_URL_MS_BUSSINES as string | undefined)?.trim();
  const baseUrl = configuredUrl ?? fallbackHttpUrl;

  if (!baseUrl) {
    return null;
  }

  const normalizedBaseUrl = normalizeBaseUrl(toHttpScheme(baseUrl));

  if (normalizedBaseUrl.startsWith("http://") || normalizedBaseUrl.startsWith("https://")) {
    const normalizedNamespace = namespace.startsWith("/") ? namespace : `/${namespace}`;
    const origin = normalizeBaseUrl(stripNamespace(normalizedBaseUrl, normalizedNamespace));

    return {
      origin,
      namespace: normalizedNamespace,
      url: `${origin}${normalizedNamespace}`,
    };
  }

  return null;
}

export type RealtimeSocketMessage = Record<string, unknown>;
