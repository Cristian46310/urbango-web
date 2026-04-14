export interface User {
    id: string;
    name: string;
    email: string;
    githubUsername?: string;
    githubLinked?: boolean;
}

export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
}

export type UpdateUserDTO = Partial<CreateUserDTO>;

export interface AssignRolesDTO {
    userId: string;
    roleIds: string[];
}