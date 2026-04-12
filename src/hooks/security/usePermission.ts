import { useMemo } from "react";
import { usePermissionStore } from "@/store";
import type {
  CreatePermissionDTO,
  UpdatePermissionDTO,
} from "@/core/domain/entities/security/Permission";
import type { PageableQuery } from "@/core/types/Page";

export function usePermission() {
  const {
    permissions,
    permissionsPage,
    loading,
    error,
    fetchPermission,
    fetchAllPermissions,
    createPermission,
    updatePermission,
    deletePermission,
  } = usePermissionStore();

  return useMemo(() => ({
    permissions,
    permissionsPage,
    loading,
    error,
    loadPermissions: (pageable?: PageableQuery) => fetchAllPermissions(pageable),
    getPermissionById: (permissionId: string) => fetchPermission(permissionId),
    addPermission: (permissionData: CreatePermissionDTO) => createPermission(permissionData),
    editPermission: (permissionId: string, permissionData: UpdatePermissionDTO) =>
      updatePermission(permissionId, permissionData),
    removePermission: (permissionId: string) => deletePermission(permissionId),
  }), [permissions, permissionsPage, loading, error]);
}
