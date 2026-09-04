import axios from 'axios';

const OAUTH_ONLY_PATTERNS = [
  /oauth only/i,
  /uses oauth/i,
  /cuenta.*oauth/i,
  /sign in with your identity provider/i,
];

export function mapLoginErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (OAUTH_ONLY_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return 'Esta cuenta usa Google/GitHub; inicia sesión con ese proveedor.';
  }

  return trimmed;
}

function mapForbiddenMessage(message: string): string {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (
    /(citizen|ciudadano)/i.test(lower) &&
    /(profile|perfil|needed|requir|necesitas|need)/i.test(lower)
  ) {
    return 'Necesitas un perfil de ciudadano para esta acción.';
  }

  if (
    /(driver|conductor)/i.test(lower) &&
    /(profile|perfil|needed|requir|necesitas|need)/i.test(lower)
  ) {
    return 'Necesitas un perfil de conductor para esta acción.';
  }

  if (
    /^forbidden$/i.test(trimmed) ||
    /^access denied$/i.test(trimmed) ||
    /request failed with status code 403/i.test(trimmed)
  ) {
    return 'No tienes permiso para realizar esta acción.';
  }

  return trimmed;
}

export function getApiErrorMessage(error: unknown, fallback = 'Error inesperado'): string {
  let raw = fallback;
  let status: number | undefined;

  if (axios.isAxiosError(error)) {
    status = error.response?.status;
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) {
      raw = data;
    } else if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      const message = record.message ?? record.error;
      if (typeof message === 'string' && message.trim()) {
        raw = message;
      } else if (Array.isArray(message) && message.length > 0) {
        raw = message.map(String).join(', ');
      } else if (error.message) {
        raw = error.message;
      }
    } else if (error.message) {
      raw = error.message;
    }
  } else if (error instanceof Error && error.message) {
    raw = error.message;
  }

  const mapped = mapLoginErrorMessage(raw);
  if (status === 403) {
    return mapForbiddenMessage(mapped);
  }

  return mapped;
}
