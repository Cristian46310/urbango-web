import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { Role } from "@/core/domain/entities/security/Role";
import type { IRoleRepository } from "@/core/domain/interfaces/security/IRoleRepository";

export class RoleRepository implements IRoleRepository {
  async getRole(roleId: string): Promise<Role> {
    return await httpMsSecurity.get<Role>(ENDPOINTS.ROLE.BY_ID(roleId));
  }

  async getAllRoles(): Promise<Role[]> {
    return await httpMsSecurity.get<Role[]>(ENDPOINTS.ROLE.BASE);
  }
}

export const roleRepository = new RoleRepository();
