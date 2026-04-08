import type {
  CreatePermissionDTO,
  Permission,
} from "@/core/domain/entities/security/Permission";
import type { IPermissionRepository } from "@/core/domain/interfaces/security/IPermissionRepository";

export class PostPermissionUseCase {
  private permissionRepository: IPermissionRepository;

  constructor(permissionRepository: IPermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  async execute(permissionData: CreatePermissionDTO): Promise<Permission> {
    return await this.permissionRepository.postPermission(permissionData);
  }
}
