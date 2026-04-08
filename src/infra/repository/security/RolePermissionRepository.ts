import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { IRolePermissionRepository } from "@/core/domain/interfaces/security/IRolePermissionRepository";
import type { MessageResponse } from "@/core/types/MessageResponse";

export class RolePermissionRepository implements IRolePermissionRepository {
  async addRolePermission(roleId: string, permissionId: string): Promise<MessageResponse> {
    return await httpMsSecurity.post<MessageResponse>(
      ENDPOINTS.ROLE_PERMISSION.BASE(roleId, permissionId),
    );
  }

  async removeRolePermission(rolePermissionId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(
      ENDPOINTS.ROLE_PERMISSION.BY_ID(rolePermissionId),
    );
  }
}

export const rolePermissionRepository = new RolePermissionRepository();
