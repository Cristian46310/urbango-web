import { useRoleStore } from "@/store";
import type { PageableQuery } from "@/core/types/Page";
export function useRole() {
  const { roles, rolesPage, loading, error, fetchRole, fetchAllRoles } = useRoleStore();

  return {
    roles,
    rolesPage,
    loading,
    error,
    loadRoles: (pageable?: PageableQuery) => fetchAllRoles(pageable),
    getRoleById: (roleId: string) => fetchRole(roleId),
  };
}
