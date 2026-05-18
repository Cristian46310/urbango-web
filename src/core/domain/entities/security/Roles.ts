/**
 * Role definitions - Must match backend roles exactly
 * These are the roles returned by ms-security
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  ADMIN_BUS: 'ADMIN_BUS',
  SUPERVISER: 'SUPERVISER', // Note: SUPERVISER not SUPERVISOR
  DRIVER: 'DRIVER',
  CITIZEN: 'CITEZEN',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Role groups for permission checking
 */
export const ROLE_GROUPS = {
  // All users who can access admin features
  ADMIN_ROLES: [ROLES.ADMIN, ROLES.ADMIN_BUS, ROLES.SUPERVISER] as const,
  
  // Users who can access paraderos and descenso
  PARADEROS_ACCESS: [ROLES.CITIZEN, ROLES.DRIVER, ROLES.ADMIN, ROLES.ADMIN_BUS, ROLES.SUPERVISER] as const,
  
  // Users who can access descenso
  DESCENSO_ACCESS: [ROLES.CITIZEN, ROLES.DRIVER, ROLES.ADMIN, ROLES.ADMIN_BUS, ROLES.SUPERVISER] as const,
  
  // Users who can access incident report
  INCIDENT_REPORT_ACCESS: [ROLES.DRIVER, ROLES.ADMIN, ROLES.ADMIN_BUS, ROLES.SUPERVISER] as const,
} as const;
