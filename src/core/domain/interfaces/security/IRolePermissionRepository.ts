import type { MessageResponse } from "@/core/types/MessageResponse";
import type { AssignMultipleRolePermissionsDTO } from "@/core/domain/entities/security/Role";

export interface IRolePermissionRepository {
  addRolePermission(roleId: string, permissionId: string): Promise<MessageResponse>;
  assignMultipleRolePermissions(payload: AssignMultipleRolePermissionsDTO): Promise<MessageResponse>;
  removeRolePermission(rolePermissionId: string): Promise<void>;
}
