export interface JwtPayload {
  [key: string]: unknown;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(
      decoded
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    ));
  } catch {
    return null;
  }
}

export function hasAllowedRole(token: string, allowedRoles: string[]): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  const rawRole = payload.role ?? payload.roles ?? payload.user?.role ?? payload.user?.roles;
  const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];

  const flattened = roles.flatMap((role) => {
    if (typeof role === "string") {
      return [role.toLowerCase()];
    }
    if (typeof role === "object" && role !== null) {
      return Object.values(role)
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.toLowerCase());
    }
    return [];
  });

  return allowedRoles.some((allowed) => flattened.includes(allowed.toLowerCase()));
}
