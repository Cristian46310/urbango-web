import { useRoleStore } from "@/store";
import type { Role } from "@/core/domain/entities/security/Role";

export function useRole() {
  const {
    roles,
    loading,
    error,
    fetchRole,
    fetchAllRoles,
    createRole,
    updateRole,
    deleteRole,
  } = useRoleStore();

  return {
    roles,
    loading,
    error,
    loadRoles: () => fetchAllRoles(),
    getRoleById: (roleId: string) => fetchRole(roleId),
    addRole: (roleData: Role) => createRole(roleData),
    editRole: (roleId: string, roleData: Role) => updateRole(roleId, roleData),
    removeRole: (roleId: string) => deleteRole(roleId),
  };
}
