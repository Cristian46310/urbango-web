import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { IUserRoleRepository } from "@/core/domain/interfaces/security/IUserRoleRepository";
import type { MessageResponse } from "@/core/types/MessageResponse";
import type { AssignRolesDTO } from "@/core/domain/entities/security/User";

export class UserRoleRepository implements IUserRoleRepository {
  async deleteUserRole(userRoleId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(ENDPOINTS.USER_ROLE.BY_ID(userRoleId));
  }

  async postUserRole(userId: string, roleId: string): Promise<MessageResponse> {
    return await httpMsSecurity.post<MessageResponse>(ENDPOINTS.USER_ROLE.BASE(userId, roleId));
  }

  async assignMultipleRoles(payload: AssignRolesDTO): Promise<MessageResponse> {
    return await httpMsSecurity.post<MessageResponse>(ENDPOINTS.USER_ROLE.ASSIGN_MULTIPLE, payload);
  }
}

export const userRoleRepository = new UserRoleRepository();