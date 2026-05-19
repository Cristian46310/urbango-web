import { useMemo } from "react";
import { useRoleStore } from "@/store";
import type { CreateRoleDTO } from "@/core/domain/entities/security/Role";
import type { PageableQuery } from "@/core/types/Page";

export function useRole() {
  const { roles, rolesPage, loading, error, fetchRole, fetchAllRoles, createRole } = useRoleStore();

  return useMemo(() => ({
    roles,
    rolesPage,
    loading,
    error,
    loadRoles: (pageable?: PageableQuery) => fetchAllRoles(pageable),
    getRoleById: (roleId: string) => fetchRole(roleId),
    addRole: (roleData: CreateRoleDTO) => createRole(roleData),
  }), [roles, rolesPage, loading, error, fetchRole, fetchAllRoles, createRole]);
}
