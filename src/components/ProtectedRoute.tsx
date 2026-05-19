import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { hasAllowedRole } from "@/lib/jwt";

interface ProtectedRouteProps {
  roles: string[];
  children: ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAllowedRole(token, roles)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
