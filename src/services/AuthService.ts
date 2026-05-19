const AUTH_TOKEN_STORAGE_KEY = 'authToken';

export interface DecodedToken {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
  [key: string]: unknown;
}

function normalizeRoles(rolesData: unknown): string[] {
  if (Array.isArray(rolesData)) {
    return rolesData.filter(
      (role): role is string => typeof role === 'string' && role.trim().length > 0
    );
  }

  if (typeof rolesData === 'string') {
    return rolesData
      .split(/[,\s]+/)
      .map(role => role.trim())
      .filter(role => role.length > 0);
  }

  return [];
}

export const AuthService = {
  decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const decoded = JSON.parse(atob(payload)) as Record<string, unknown>;

      return {
        ...decoded,
        roles: normalizeRoles(decoded.roles),
      } as DecodedToken;
    } catch {
      return null;
    }
  },

  isTokenExpired(token: string): boolean {
    const decoded = AuthService.decodeToken(token);

    if (!decoded?.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);

    return decoded.exp < currentTime;
  },

  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  },

  saveToken(token: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  },

  getDecodedToken(): DecodedToken | null {
    const token = AuthService.getToken();

    if (!token) {
      return null;
    }

    if (AuthService.isTokenExpired(token)) {
      AuthService.removeToken();
      return null;
    }

    return AuthService.decodeToken(token);
  },

  isAuthenticated(): boolean {
    const token = AuthService.getToken();

    if (!token) {
      return false;
    }

    if (AuthService.isTokenExpired(token)) {
      AuthService.removeToken();
      return false;
    }

    return true;
  },

  hasRole(role: string): boolean {
    const userRoles = AuthService.getRoles();

    return userRoles.includes(role);
  },

  hasAnyRole(roles: string[]): boolean {
    const userRoles = AuthService.getRoles();

    if (userRoles.length === 0 || roles.length === 0) {
      return false;
    }

    return roles.some(role => userRoles.includes(role));
  },

  hasAllRoles(roles: string[]): boolean {
    const userRoles = AuthService.getRoles();

    if (userRoles.length === 0 || roles.length === 0) {
      return false;
    }

    return roles.every(role => userRoles.includes(role));
  },

  getCurrentUser() {
    const decoded = AuthService.getDecodedToken();

    if (!decoded) {
      return null;
    }

    return {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
    };
  },

  getRoles(): string[] {
    const decoded = AuthService.getDecodedToken();

    return decoded?.roles ?? [];
  },

  logout(): void {
    AuthService.removeToken();
  },
};
