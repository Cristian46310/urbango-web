export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
}

export interface AssignRolesDTO {
  userId: string;
  roleIds: string[];
}
