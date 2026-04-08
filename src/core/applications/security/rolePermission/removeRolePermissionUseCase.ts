import type { IRolePermissionRepository } from "@/core/domain/interfaces/security/IRolePermissionRepository";

export class RemoveRolePermissionUseCase {
  private rolePermissionRepository: IRolePermissionRepository;

  constructor(rolePermissionRepository: IRolePermissionRepository) {
    this.rolePermissionRepository = rolePermissionRepository;
  }

  async execute(rolePermissionId: string): Promise<void> {
    if (!rolePermissionId) {
      throw new Error("Role permission ID is required");
    }

    await this.rolePermissionRepository.removeRolePermission(rolePermissionId);
  }
}
