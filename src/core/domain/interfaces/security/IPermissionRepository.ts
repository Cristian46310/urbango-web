import type {
  CreatePermissionDTO,
  Permission,
  UpdatePermissionDTO,
} from "@/core/domain/entities/security/Permission";
import type { Page, PageableQuery } from "@/core/types/Page";

export interface IPermissionRepository {
  deletePermission(permissionId: string): Promise<void>;
  putPermission(permissionId: string, permissionData: UpdatePermissionDTO): Promise<Permission>;
  getPermission(permissionId: string): Promise<Permission>;
  getAllPermissions(pageable: PageableQuery): Promise<Page<Permission>>;
  postPermission(permissionData: CreatePermissionDTO): Promise<Permission>;
}
