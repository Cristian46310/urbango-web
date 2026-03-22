import type { IRoleRepository } from "@/core/domain/interfaces/security/IRoleRepository";

export class DeleteRoleUseCase {
  private roleRepository: IRoleRepository;

  constructor(roleRepository: IRoleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute(roleId: string): Promise<void> {
    if (!roleId) {
      throw new Error("Role ID is required");
    }
    await this.roleRepository.deleteRole(roleId);
  }
}