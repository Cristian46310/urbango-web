export interface Role {
    id: string;
    name: string;
    description: string;
}

export interface CreateRoleDTO extends Omit<Role, 'id'> {}

export interface UpdateRoleDTO extends Partial<CreateRoleDTO> {}