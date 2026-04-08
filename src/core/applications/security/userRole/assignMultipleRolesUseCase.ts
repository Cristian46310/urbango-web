import type { IUserRoleRepository } from "@/core/domain/interfaces/security/IUserRoleRepository";
import type { AssignRolesDTO } from "@/core/domain/entities/security/UserRole";
import type { MessageResponse } from "@/core/types/MessageResponse";

export class AssignMultipleRolesUseCase {
  private userRoleRepository: IUserRoleRepository;

  constructor(userRoleRepository: IUserRoleRepository) {
    this.userRoleRepository = userRoleRepository;
  }

  async execute(payload: AssignRolesDTO): Promise<MessageResponse> {
    if (!payload.userId) {
      throw new Error("User ID is required");
    }
    if (!payload.roleIds.length) {
      throw new Error("At least one role ID is required");
    }

    return await this.userRoleRepository.assignMultipleRoles(payload);
  }
}
