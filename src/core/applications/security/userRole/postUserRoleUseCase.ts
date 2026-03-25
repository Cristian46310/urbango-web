import type { IUserRoleRepository } from "@/core/domain/interfaces/security/IUserRoleRepository";
import type { MessageResponse } from "@/core/types/MessageResponse";

export class PostUserRoleUseCase {
  private userRoleRepository: IUserRoleRepository;

  constructor(userRoleRepository: IUserRoleRepository) {
    this.userRoleRepository = userRoleRepository;
  }

  async execute(userId: string, roleId: string): Promise<MessageResponse> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!roleId) {
      throw new Error("Role ID is required");
    }
    return await this.userRoleRepository.postUserRole(userId, roleId);
  }
}