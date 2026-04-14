import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { Role } from "@/core/domain/entities/security/Role";
import type { IRoleRepository } from "@/core/domain/interfaces/security/IRoleRepository";
import type { Page, PageableQuery } from "@/core/types/Page";

export class RoleRepository implements IRoleRepository {
  async getRole(roleId: string): Promise<Role> {
    return await httpMsSecurity.get<Role>(ENDPOINTS.ROLE.BY_ID(roleId));
  }

  async getAllRoles(pageable: PageableQuery): Promise<Page<Role>> {
    return await httpMsSecurity.get<Page<Role>>(ENDPOINTS.ROLE.BASE, {
      params: pageable,
    });
  }
}

export const roleRepository = new RoleRepository();
