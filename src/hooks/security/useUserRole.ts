import { useMemo } from "react";
import { useUserRoleStore } from "@/store";
import type { AssignRolesDTO } from "@/core/domain/entities/security/User";

export function useUserRole() {
  const {
    loading,
    error,
    assignRole,
    assignMultipleRoles,
    removeRole,
  } = useUserRoleStore();

  return useMemo(() => ({
    loading,
    error,
    assignRoleToUser: (userId: string, roleId: string) => assignRole(userId, roleId),
    assignMultipleRolesToUser: (payload: AssignRolesDTO) => assignMultipleRoles(payload),
    removeRoleFromUser: (userId: string, roleId: string) => removeRole(userId, roleId),
  }), [loading, error]);
}
