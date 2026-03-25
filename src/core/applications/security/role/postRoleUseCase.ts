import type { CreateRoleDTO, Role } from "@/core/domain/entities/security/Role";
import type { IRoleRepository } from "@/core/domain/interfaces/security/IRoleRepository";

export class PostRoleUseCase {
  private roleRepository: IRoleRepository;

  constructor(roleRepository: IRoleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute(roleData: CreateRoleDTO): Promise<Role> {
    return await this.roleRepository.postRole(roleData);
  }
}