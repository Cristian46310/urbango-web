import type { IPermissionRepository } from "@/core/domain/interfaces/security/IPermissionRepository";

export class DeletePermissionUseCase {
  private permissionRepository: IPermissionRepository;

  constructor(permissionRepository: IPermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  async execute(permissionId: string): Promise<void> {
    if (!permissionId) {
      throw new Error("Permission ID is required");
    }

    await this.permissionRepository.deletePermission(permissionId);
  }
}
