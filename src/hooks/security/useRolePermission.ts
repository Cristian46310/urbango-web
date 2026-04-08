import { useRolePermissionStore } from "@/store";

export function useRolePermission() {
  const {
    loading,
    error,
    addPermissionToRole,
    removePermissionFromRole,
  } = useRolePermissionStore();

  return {
    loading,
    error,
    assignPermissionToRole: (roleId: string, permissionId: string) =>
      addPermissionToRole(roleId, permissionId),
    removePermissionRoleLink: (rolePermissionId: string) =>
      removePermissionFromRole(rolePermissionId),
  };
}
