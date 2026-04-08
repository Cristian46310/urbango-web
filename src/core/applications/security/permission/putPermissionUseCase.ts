import type {
  Permission,
  UpdatePermissionDTO,
} from "@/core/domain/entities/security/Permission";
import type { IPermissionRepository } from "@/core/domain/interfaces/security/IPermissionRepository";

export class PutPermissionUseCase {
  private permissionRepository: IPermissionRepository;

  constructor(permissionRepository: IPermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  async execute(permissionId: string, permissionData: UpdatePermissionDTO): Promise<Permission> {
    if (!permissionId) {
      throw new Error("Permission ID is required");
    }

    return await this.permissionRepository.putPermission(permissionId, permissionData);
  }
}
