import type { Role } from "@/core/domain/entities/security/Role";

export interface IRoleRepository {
  getRole(roleId: string): Promise<Role>;
  getAllRoles(): Promise<Role[]>;
}