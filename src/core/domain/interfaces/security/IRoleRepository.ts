import type { Role } from "@/core/domain/entities/security/Role";
import type { Page, PageableQuery } from "@/core/types/Page";

export interface IRoleRepository {
  getRole(roleId: string): Promise<Role>;
  getAllRoles(pageable: PageableQuery): Promise<Page<Role>>;
}