import type { IUserRoleRepository } from "@/core/domain/interfaces/security/IUserRoleRepository";

export class DeleteUserRoleUseCase {
  private userRoleRepository: IUserRoleRepository;

  constructor(userRoleRepository: IUserRoleRepository) {
    this.userRoleRepository = userRoleRepository;
  }

  async execute(userRoleId: string): Promise<void> {
    if (!userRoleId) {
      throw new Error("User Role ID is required");
    }
    await this.userRoleRepository.deleteUserRole(userRoleId);
  }
}