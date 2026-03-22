import { httpMsSecurity } from "@/app/infra/api/builderHttp";
import { ENDPOINTS } from "@/app/infra/api/endpoints";
import type { Role } from "@/core/domain/entities/security/Role";
import type { IRoleRepository } from "@/core/domain/interfaces/security/IRoleRepository";

export class RoleRepository implements IRoleRepository {
  async deleteRole(roleId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(ENDPOINTS.ROLE.BY_ID(roleId));
  }

  async putRole(roleId: string, roleData: Role): Promise<Role> {
    return await httpMsSecurity.put<Role>(ENDPOINTS.ROLE.BY_ID(roleId), roleData);
  }

  async getRole(roleId: string): Promise<Role> {
    return await httpMsSecurity.get<Role>(ENDPOINTS.ROLE.BY_ID(roleId));
  }

  async getAllRoles(): Promise<Role[]> {
    return await httpMsSecurity.get<Role[]>(ENDPOINTS.ROLE.BASE);
  }

  async postRole(roleData: Role): Promise<Role> {
    return await httpMsSecurity.post<Role>(ENDPOINTS.ROLE.BASE, roleData);
  }
}

export const roleRepository = new RoleRepository();