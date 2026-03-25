import type { User } from "./User";

export interface Session {
    id: string;
    token: string;
    expiration: Date;
    code2FA: string;
    user: User
}

export interface CreateSessionDTO extends Omit<Session, 'id'> {}

export interface UpdateSessionDTO extends Partial<CreateSessionDTO> {}