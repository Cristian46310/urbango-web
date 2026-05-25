const AUTH_TOKEN_STORAGE_KEY = 'authToken';

export interface DecodedToken {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
  id?: string;
  [key: string]: unknown;
}

/** Normaliza variantes del backend (p. ej. CITEZEN → CITIZEN). */
export function normalizeRoleName(role: string): string {
  const upper = role.trim().toUpperCase();
  if (upper === 'CITEZEN') {
    return 'CITIZEN';
  }
  return upper;
}

function normalizeRoles(rolesData: unknown): string[] {
  const raw: string[] = [];

  if (Array.isArray(rolesData)) {
    raw.push(
      ...rolesData.filter(
        (role): role is string => typeof role === 'string' && role.trim().length > 0,
      ),
    );
  } else if (typeof rolesData === 'string') {
    raw.push(
      ...rolesData
        .split(/[,\s]+/)
        .map((role) => role.trim())
        .filter((role) => role.length > 0),
    );
  }

  return [...new Set(raw.map(normalizeRoleName))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const parsed: unknown = JSON.parse(atob(payload));

    if (!isRecord(parsed)) {
      return null;
    }

    const sub = typeof parsed.sub === 'string' ? parsed.sub : '';
    const email = typeof parsed.email === 'string' ? parsed.email : '';
    const iat = typeof parsed.iat === 'number' ? parsed.iat : 0;
    const exp = typeof parsed.exp === 'number' ? parsed.exp : 0;

    return {
      ...parsed,
      sub,
      email,
      iat,
      exp,
      roles: normalizeRoles(parsed.roles),
    };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);

  if (!decoded) {
    return true;
  }

  if (!decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);

  return decoded.exp < currentTime;
}

function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function saveToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

function getDecodedToken(): DecodedToken | null {
  const token = getToken();

  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    removeToken();
    return null;
  }

  return decodeToken(token);
}

function isAuthenticated(): boolean {
  const token = getToken();

  if (!token) {
    return false;
  }

  if (isTokenExpired(token)) {
    removeToken();
    return false;
  }

  return true;
}

function hasRole(role: string): boolean {
  const userRoles = getRoles();
  const target = normalizeRoleName(role);

  return userRoles.includes(target);
}

function hasAnyRole(roles: readonly string[]): boolean {
  const userRoles = getRoles();

  if (userRoles.length === 0 || roles.length === 0) {
    return false;
  }

  return roles.some((role) => userRoles.includes(normalizeRoleName(role)));
}

function hasAllRoles(roles: readonly string[]): boolean {
  const userRoles = getRoles();

  if (userRoles.length === 0 || roles.length === 0) {
    return false;
  }

  return roles.every((role) => userRoles.includes(normalizeRoleName(role)));
}

function getCurrentUser() {
  const decoded = getDecodedToken();

  if (!decoded) {
    return null;
  }

  return {
    id: decoded.sub,
    email: decoded.email,
    roles: decoded.roles,
  };
}

function getRoles(): string[] {
  const decoded = getDecodedToken();

  return decoded?.roles ?? [];
}

function logout(): void {
  removeToken();
}

export const AuthService = {
  normalizeRoleName,
  decodeToken,
  isTokenExpired,
  getToken,
  saveToken,
  removeToken,
  getDecodedToken,
  isAuthenticated,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getCurrentUser,
  getRoles,
  logout,
};
