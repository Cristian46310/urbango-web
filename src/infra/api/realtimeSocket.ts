const DEFAULT_REALTIME_NAMESPACE = "/dashboard/realtime";
const AUTH_TOKEN_STORAGE_KEY = "authToken";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

/** Socket.IO options for ms-business dashboard realtime (JWT required). */
export function getRealtimeSocketAuthOptions(config: RealtimeSocketConfig): {
  path: string;
  auth: { token: string };
  transports: ["websocket"];
  reconnection: boolean;
  reconnectionDelay: number;
} | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!token) {
    return null;
  }

  return {
    path: config.wsPath,
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 3000,
  };
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
  /** Socket.IO handshake path: `<namespace>/ws` */
  wsPath: string;
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
      wsPath: `${normalizedNamespace}/ws`,
    };
  }

  return null;
}

export type RealtimeSocketMessage = Record<string, unknown>;
