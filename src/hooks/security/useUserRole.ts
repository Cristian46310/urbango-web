import { useUserRoleStore } from "@/store";
import type { AssignRolesDTO } from "@/core/domain/entities/security/UserRole";

export function useUserRole() {
  const {
    loading,
    error,
    assignRole,
    assignMultipleRoles,
    removeRole,
  } = useUserRoleStore();

  return {
    loading,
    error,
    assignRoleToUser: (userId: string, roleId: string) => assignRole(userId, roleId),
    assignMultipleRolesToUser: (payload: AssignRolesDTO) => assignMultipleRoles(payload),
    removeRoleFromUser: (userRoleId: string) => removeRole(userRoleId),
  };
}
