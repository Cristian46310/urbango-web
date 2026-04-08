import type {
  CreatePermissionDTO,
  Permission,
  UpdatePermissionDTO,
} from "@/core/domain/entities/security/Permission";

export interface IPermissionRepository {
  deletePermission(permissionId: string): Promise<void>;
  putPermission(permissionId: string, permissionData: UpdatePermissionDTO): Promise<Permission>;
  getPermission(permissionId: string): Promise<Permission>;
  getAllPermissions(): Promise<Permission[]>;
  postPermission(permissionData: CreatePermissionDTO): Promise<Permission>;
}
