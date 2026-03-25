import type { CreateRoleDTO, Role, UpdateRoleDTO } from "@/core/domain/entities/security/Role";

export interface IRoleRepository {
  deleteRole(roleId: string): Promise<void>;
  putRole(roleId: string, roleData: UpdateRoleDTO): Promise<Role>;
  getRole(roleId: string): Promise<Role>;
  getAllRoles(): Promise<Role[]>;
  postRole(roleData: CreateRoleDTO): Promise<Role>;
}