import type { Role } from "@/core/domain/entities/security/Role";
import type { IRoleRepository } from "@/core/domain/interfaces/security/IRoleRepository";

export class GetRoleUseCase {
  private roleRepository: IRoleRepository;

  constructor(roleRepository: IRoleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute(roleId: string): Promise<Role> {
    if (!roleId) {
      throw new Error("Role ID is required");
    }
    return await this.roleRepository.getRole(roleId);
  }
}