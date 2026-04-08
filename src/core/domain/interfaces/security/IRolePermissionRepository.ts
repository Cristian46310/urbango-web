import type { MessageResponse } from "@/core/types/MessageResponse";

export interface IRolePermissionRepository {
  addRolePermission(roleId: string, permissionId: string): Promise<MessageResponse>;
  removeRolePermission(rolePermissionId: string): Promise<void>;
}
