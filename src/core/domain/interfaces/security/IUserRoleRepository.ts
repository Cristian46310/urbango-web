import type { MessageResponse } from "@/core/types/MessageResponse";
import type { AssignRolesDTO } from "@/core/domain/entities/security/UserRole";

export interface IUserRoleRepository {
  deleteUserRole(userRoleId: string): Promise<void>;
  postUserRole(userId: string, roleId: string): Promise<MessageResponse>;
  assignMultipleRoles(payload: AssignRolesDTO): Promise<MessageResponse>;
}