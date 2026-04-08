export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
}

export type CreateUserDTO = Omit<User, 'id'>;

export type UpdateUserDTO = Partial<CreateUserDTO>;