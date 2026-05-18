import { useAuthStore } from '@/store/security/authStore';
import { ROLE_GROUPS } from '@/core/domain/entities/security/Roles';

/**
 * Hook to check user role-based permissions
 * Provides semantic methods for common permission checks
 * 
 * Usage:
 * const { canAccessAdmin, canAccessParaderos } = useCanAccess();
 */
export const useCanAccess = () => {
  const { hasAnyRole } = useAuthStore();

  return {
    // Admin features
    canAccessAdmin: () => hasAnyRole(ROLE_GROUPS.ADMIN_ROLES),
    canManageUsers: () => hasAnyRole(ROLE_GROUPS.ADMIN_ROLES),
    canManageRoles: () => hasAnyRole(ROLE_GROUPS.ADMIN_ROLES),
    canManagePermissions: () => hasAnyRole(ROLE_GROUPS.ADMIN_ROLES),
    canManageProfiles: () => hasAnyRole(ROLE_GROUPS.ADMIN_ROLES),

    // Business features
    canAccessParaderos: () => hasAnyRole(ROLE_GROUPS.PARADEROS_ACCESS),
    canValidateDescenso: () => hasAnyRole(ROLE_GROUPS.DESCENSO_ACCESS),
    canReportIncidents: () => hasAnyRole(ROLE_GROUPS.INCIDENT_REPORT_ACCESS),

    // Generic role check
    hasAnyRole,
  };
};
