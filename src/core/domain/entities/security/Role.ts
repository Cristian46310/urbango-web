export interface Role {
    id: string;
    name: string;
    description: string;
    relationId?: string;
}

export interface AssignRolePermissionDTO {
    roleId: string;
    permissionId: string;
}

export interface AssignMultipleRolePermissionsDTO {
    roleId: string;
    permissionIds: string[];
}

export interface CreateRoleDTO {
  name: string;
  description: string;
}

