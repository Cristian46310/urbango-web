const AUTH_TOKEN_STORAGE_KEY = 'authToken';

export interface DecodedToken {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
  [key: string]: unknown;
}

export class AuthService {
  /**
   * Normalize roles to array format
   * Handles:
   * - array
   * - comma-separated string
   * - space-separated string
   */
  private static normalizeRoles(rolesData: unknown): string[] {
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

  static decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const decoded = JSON.parse(atob(payload));

      return {
        ...decoded,
        roles: this.normalizeRoles(decoded.roles),
      } as DecodedToken;
    } catch {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);

    if (!decoded?.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);

    return decoded.exp < currentTime;
  }

  static getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  }

  static saveToken(token: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }

  static removeToken(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  static getDecodedToken(): DecodedToken | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      this.removeToken();
      return null;
    }

    return this.decodeToken(token);
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.removeToken();
      return false;
    }

    return true;
  }

  /**
   * Check if user has a specific role
   */
  static hasRole(role: string): boolean {
    const userRoles = this.getRoles();

    return userRoles.includes(role);
  }

  /**
   * Check if user has ANY of the provided roles
   */
  static hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getRoles();

    if (userRoles.length === 0 || roles.length === 0) {
      return false;
    }

    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Check if user has ALL of the provided roles
   */
  static hasAllRoles(roles: string[]): boolean {
    const userRoles = this.getRoles();

    if (userRoles.length === 0 || roles.length === 0) {
      return false;
    }

    return roles.every(role => userRoles.includes(role));
  }

  static getCurrentUser() {
    const decoded = this.getDecodedToken();

    if (!decoded) {
      return null;
    }

    return {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
    };
  }

  static getRoles(): string[] {
    const decoded = this.getDecodedToken();

    return decoded?.roles ?? [];
  }

  static logout(): void {
    this.removeToken();
  }
}