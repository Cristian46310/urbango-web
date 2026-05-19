import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuthStore } from '@/store/security/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isInitialized, isAuthenticated } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
