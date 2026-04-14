import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  CreatePermissionDTO,
  Permission,
  UpdatePermissionDTO,
} from "@/core/domain/entities/security/Permission";
import type { IPermissionRepository } from "@/core/domain/interfaces/security/IPermissionRepository";
import type { Page, PageableQuery } from "@/core/types/Page";

export class PermissionRepository implements IPermissionRepository {
  async deletePermission(permissionId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(ENDPOINTS.PERMISSION.BY_ID(permissionId));
  }

  async putPermission(permissionId: string, permissionData: UpdatePermissionDTO): Promise<Permission> {
    return await httpMsSecurity.put<Permission>(
      ENDPOINTS.PERMISSION.BY_ID(permissionId),
      permissionData,
    );
  }

  async getPermission(permissionId: string): Promise<Permission> {
    return await httpMsSecurity.get<Permission>(ENDPOINTS.PERMISSION.BY_ID(permissionId));
  }

  async getAllPermissions(pageable: PageableQuery): Promise<Page<Permission>> {
    return await httpMsSecurity.get<Page<Permission>>(ENDPOINTS.PERMISSION.BASE, {
      params: pageable,
    });
  }

  async postPermission(permissionData: CreatePermissionDTO): Promise<Permission> {
    return await httpMsSecurity.post<Permission>(ENDPOINTS.PERMISSION.BASE, permissionData);
  }
}

export const permissionRepository = new PermissionRepository();
