import type { User } from "./User";

export interface Session {
    id: string;
    token: string;
    expiration: Date;
    code2FA: string;
    user: User
}

export type CreateSessionDTO = Omit<Session, 'id'>;

export type UpdateSessionDTO = Partial<CreateSessionDTO>;