import type { Role, UpdateRoleDTO } from "@/core/domain/entities/security/Role";
import type { IRoleRepository } from "@/core/domain/interfaces/security/IRoleRepository";

export class PutRoleUseCase {
  private roleRepository: IRoleRepository;

  constructor(roleRepository: IRoleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute(roleId: string, roleData: UpdateRoleDTO): Promise<Role> {
    if (!roleId) {
      throw new Error("Role ID is required");
    }
    return await this.roleRepository.putRole(roleId, roleData);
  }
}