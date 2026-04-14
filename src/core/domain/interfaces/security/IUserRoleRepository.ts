import type { MessageResponse } from "@/core/types/MessageResponse";
import type { AssignRolesDTO } from "@/core/domain/entities/security/User";

export interface IUserRoleRepository {
  deleteUserRole(userId: string, roleId: string): Promise<void>;
  postUserRole(userId: string, roleId: string): Promise<MessageResponse>;
  assignMultipleRoles(payload: AssignRolesDTO): Promise<MessageResponse>;
}