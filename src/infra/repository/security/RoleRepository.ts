import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { CreateRoleDTO, Role, UpdateRoleDTO } from "@/core/domain/entities/security/Role";
import type { IRoleRepository } from "@/core/domain/interfaces/security/IRoleRepository";

export class RoleRepository implements IRoleRepository {
  async deleteRole(roleId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(ENDPOINTS.ROLE.BY_ID(roleId));
  }

  async putRole(roleId: string, roleData: UpdateRoleDTO): Promise<Role> {
    return await httpMsSecurity.put<Role>(ENDPOINTS.ROLE.BY_ID(roleId), roleData);
  }

  async getRole(roleId: string): Promise<Role> {
    return await httpMsSecurity.get<Role>(ENDPOINTS.ROLE.BY_ID(roleId));
  }

  async getAllRoles(): Promise<Role[]> {
    return await httpMsSecurity.get<Role[]>(ENDPOINTS.ROLE.BASE);
  }

  async postRole(roleData: CreateRoleDTO): Promise<Role> {
    return await httpMsSecurity.post<Role>(ENDPOINTS.ROLE.BASE, roleData);
  }
}

export const roleRepository = new RoleRepository();