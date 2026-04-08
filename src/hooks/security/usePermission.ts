import { usePermissionStore } from "@/store";
import type {
  CreatePermissionDTO,
  UpdatePermissionDTO,
} from "@/core/domain/entities/security/Permission";

export function usePermission() {
  const {
    permissions,
    loading,
    error,
    fetchPermission,
    fetchAllPermissions,
    createPermission,
    updatePermission,
    deletePermission,
  } = usePermissionStore();

  return {
    permissions,
    loading,
    error,
    loadPermissions: () => fetchAllPermissions(),
    getPermissionById: (permissionId: string) => fetchPermission(permissionId),
    addPermission: (permissionData: CreatePermissionDTO) => createPermission(permissionData),
    editPermission: (permissionId: string, permissionData: UpdatePermissionDTO) =>
      updatePermission(permissionId, permissionData),
    removePermission: (permissionId: string) => deletePermission(permissionId),
  };
}
