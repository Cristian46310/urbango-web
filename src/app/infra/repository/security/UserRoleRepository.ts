import { httpMsSecurity } from "@/app/infra/api/builderHttp";
import { ENDPOINTS } from "@/app/infra/api/endpoints";
import type { IUserRoleRepository } from "@/core/domain/interfaces/security/IUserRoleRepository";

export class UserRoleRepository implements IUserRoleRepository {
  async deleteUserRole(userRoleId: string): Promise<void> {
    await httpMsSecurity.delete<void>(ENDPOINTS.USER_ROLE.BY_ID(userRoleId));
  }

  async postUserRole(userId: string, roleId: string): Promise<unknown> {
    return await httpMsSecurity.post<unknown>(ENDPOINTS.USER_ROLE.BASE(userId, roleId));
  }
}

export const userRoleRepository = new UserRoleRepository();