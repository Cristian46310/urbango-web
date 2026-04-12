import type { Role } from "@/core/domain/entities/security/Role";
import type { IRoleRepository } from "@/core/domain/interfaces/security/IRoleRepository";
import type { Page, PageableQuery } from "@/core/types/Page";

export class GetAllRolesUseCase {
  private roleRepository: IRoleRepository;

  constructor(roleRepository: IRoleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute(pageable: PageableQuery): Promise<Page<Role>> {
    return await this.roleRepository.getAllRoles(pageable);
  }
}