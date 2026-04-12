import type { Permission } from "@/core/domain/entities/security/Permission";
import type { IPermissionRepository } from "@/core/domain/interfaces/security/IPermissionRepository";
import type { Page, PageableQuery } from "@/core/types/Page";

export class GetAllPermissionsUseCase {
  private permissionRepository: IPermissionRepository;

  constructor(permissionRepository: IPermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  async execute(pageable: PageableQuery): Promise<Page<Permission>> {
    return await this.permissionRepository.getAllPermissions(pageable);
  }
}
