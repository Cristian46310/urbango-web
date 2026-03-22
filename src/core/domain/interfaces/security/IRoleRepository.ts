import type { Role } from "@/core/domain/entities/security/Role";

export interface IRoleRepository {
  deleteRole(roleId: string): Promise<void>;
  putRole(roleId: string, roleData: Role): Promise<Role>;
  getRole(roleId: string): Promise<Role>;
  getAllRoles(): Promise<Role[]>;
  postRole(roleData: Role): Promise<Role>;
}