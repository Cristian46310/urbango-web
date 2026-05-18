import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuthStore } from '@/store/security/authStore';

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  /**
   * When true, user must have ALL required roles.
   * When false (default), user must have ANY of the required roles.
   */
  requireAll?: boolean;
}

/**
 * Route guard that checks if user has required roles.
 * 
 * Rules:
 * - If token is missing, expired, or invalid → redirect to login
 * - If authenticated but lacks roles → redirect to access denied
 * - If no requiredRoles specified → allow access
 * 
 * Usage:
 * <RoleGuard requiredRoles={['ADMIN', 'ADMIN_BUS']}>
 *   <Component />
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  requiredRoles = [],
  requireAll = false,
}: RoleGuardProps) {
  const { isInitialized, isAuthenticated, hasRole, hasAnyRole } = useAuthStore();

  // Still initializing auth
  if (!isInitialized) {
    return null;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no roles required, allow access
  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required roles
  const hasPermission = requireAll
    ? requiredRoles.every(role => hasRole(role))
    : hasAnyRole(requiredRoles);

  // No permission - redirect to access denied
  if (!hasPermission) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
