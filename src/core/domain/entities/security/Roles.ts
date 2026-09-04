/**
 * Role definitions - Must match backend roles exactly (ms-security).
 * Drivers usually carry CITIZEN + DRIVER together.
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  BUSINESS_ADMIN: 'BUSINESS_ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  DRIVER: 'DRIVER',
  CITIZEN: 'CITIZEN',
  /** @deprecated Prefer BUSINESS_ADMIN — kept for legacy JWTs */
  ADMIN_BUS: 'ADMIN_BUS',
  /** @deprecated Prefer SUPERVISOR — kept for legacy JWTs */
  SUPERVISER: 'SUPERVISER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Role groups for permission checking
 */
export const ROLE_GROUPS = {
  ADMIN_ROLES: [
    ROLES.ADMIN,
    ROLES.BUSINESS_ADMIN,
    ROLES.SUPERVISOR,
    ROLES.ADMIN_BUS,
    ROLES.SUPERVISER,
  ] as const,

  PARADEROS_ACCESS: [
    ROLES.CITIZEN,
    ROLES.DRIVER,
    ROLES.ADMIN,
    ROLES.BUSINESS_ADMIN,
    ROLES.SUPERVISOR,
    ROLES.ADMIN_BUS,
    ROLES.SUPERVISER,
  ] as const,

  DESCENSO_ACCESS: [
    ROLES.CITIZEN,
    ROLES.DRIVER,
    ROLES.ADMIN,
    ROLES.BUSINESS_ADMIN,
    ROLES.SUPERVISOR,
    ROLES.ADMIN_BUS,
    ROLES.SUPERVISER,
  ] as const,

  INCIDENT_REPORT_ACCESS: [
    ROLES.DRIVER,
    ROLES.ADMIN,
    ROLES.BUSINESS_ADMIN,
    ROLES.SUPERVISOR,
    ROLES.ADMIN_BUS,
    ROLES.SUPERVISER,
  ] as const,

  FLEET_ACCESS: [
    ROLES.ADMIN,
    ROLES.BUSINESS_ADMIN,
    ROLES.SUPERVISOR,
    ROLES.ADMIN_BUS,
    ROLES.SUPERVISER,
  ] as const,

  DASHBOARD_OPS: [
    ROLES.ADMIN,
    ROLES.BUSINESS_ADMIN,
    ROLES.SUPERVISOR,
    ROLES.ADMIN_BUS,
    ROLES.SUPERVISER,
  ] as const,

  MASS_ALERTS: [ROLES.ADMIN] as const,
} as const;
