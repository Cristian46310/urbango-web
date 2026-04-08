import { useRoleStore } from "@/store";
export function useRole() {
  const { roles, loading, error, fetchRole, fetchAllRoles } = useRoleStore();

  return {
    roles,
    loading,
    error,
    loadRoles: () => fetchAllRoles(),
    getRoleById: (roleId: string) => fetchRole(roleId),
  };
}
