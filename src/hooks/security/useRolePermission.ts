import { useMemo } from "react";
import { useRolePermissionStore } from "@/store";
import type { AssignMultipleRolePermissionsDTO } from "@/core/domain/entities/security/Role";

export function useRolePermission() {
  const {
    loading,
    error,
    addPermissionToRole,
    assignMultiplePermissionsToRole,
    removePermissionFromRole,
  } = useRolePermissionStore();

  return useMemo(() => ({
    loading,
    error,
    assignPermissionToRole: (roleId: string, permissionId: string) =>
      addPermissionToRole(roleId, permissionId),
    assignMultiplePermissionsToRole: (payload: AssignMultipleRolePermissionsDTO) =>
      assignMultiplePermissionsToRole(payload),
    removePermissionRoleLink: (rolePermissionId: string) =>
      removePermissionFromRole(rolePermissionId),
  }), [loading, error]);
}
