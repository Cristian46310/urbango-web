import type { IRolePermissionRepository } from "@/core/domain/interfaces/security/IRolePermissionRepository";
import type { MessageResponse } from "@/core/types/MessageResponse";

export class AddRolePermissionUseCase {
  private rolePermissionRepository: IRolePermissionRepository;

  constructor(rolePermissionRepository: IRolePermissionRepository) {
    this.rolePermissionRepository = rolePermissionRepository;
  }

  async execute(roleId: string, permissionId: string): Promise<MessageResponse> {
    if (!roleId) {
      throw new Error("Role ID is required");
    }
    if (!permissionId) {
      throw new Error("Permission ID is required");
    }

    return await this.rolePermissionRepository.addRolePermission(roleId, permissionId);
  }
}
