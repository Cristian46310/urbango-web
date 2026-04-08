import type { Permission } from "@/core/domain/entities/security/Permission";
import type { IPermissionRepository } from "@/core/domain/interfaces/security/IPermissionRepository";

export class GetPermissionUseCase {
  private permissionRepository: IPermissionRepository;

  constructor(permissionRepository: IPermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  async execute(permissionId: string): Promise<Permission> {
    if (!permissionId) {
      throw new Error("Permission ID is required");
    }

    return await this.permissionRepository.getPermission(permissionId);
  }
}
