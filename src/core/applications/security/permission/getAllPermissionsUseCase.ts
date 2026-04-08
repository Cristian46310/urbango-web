import type { Permission } from "@/core/domain/entities/security/Permission";
import type { IPermissionRepository } from "@/core/domain/interfaces/security/IPermissionRepository";

export class GetAllPermissionsUseCase {
  private permissionRepository: IPermissionRepository;

  constructor(permissionRepository: IPermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  async execute(): Promise<Permission[]> {
    return await this.permissionRepository.getAllPermissions();
  }
}
