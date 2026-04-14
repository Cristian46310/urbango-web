import type { IRolePermissionRepository } from "@/core/domain/interfaces/security/IRolePermissionRepository";
import type { AssignMultipleRolePermissionsDTO } from "@/core/domain/entities/security/Role";
import type { MessageResponse } from "@/core/types/MessageResponse";

export class AssignMultipleRolePermissionsUseCase {
  private rolePermissionRepository: IRolePermissionRepository;

  constructor(rolePermissionRepository: IRolePermissionRepository) {
    this.rolePermissionRepository = rolePermissionRepository;
  }

  async execute(payload: AssignMultipleRolePermissionsDTO): Promise<MessageResponse> {
    if (!payload.roleId) {
      throw new Error("Role ID is required");
    }
    if (!payload.permissionIds.length) {
      throw new Error("At least one permission ID is required");
    }

    return await this.rolePermissionRepository.assignMultipleRolePermissions(payload);
  }
}
