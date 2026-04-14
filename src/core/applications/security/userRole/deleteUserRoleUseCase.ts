import type { IUserRoleRepository } from "@/core/domain/interfaces/security/IUserRoleRepository";

export class DeleteUserRoleUseCase {
  private userRoleRepository: IUserRoleRepository;

  constructor(userRoleRepository: IUserRoleRepository) {
    this.userRoleRepository = userRoleRepository;
  }

  async execute(userId: string, roleId: string): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!roleId) {
      throw new Error("Role ID is required");
    }
    await this.userRoleRepository.deleteUserRole(userId, roleId);
  }
}