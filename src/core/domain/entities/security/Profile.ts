import type { User } from "./User";

export interface ProfileUserSummary {
    userId: string;
    userName: string | null;
}

export interface Profile {
    id: string;
    phone?: string | null;
    photo?: string | null;
    userId?: string | null;
    user?: ProfileUserSummary | null;
}

export interface CreateProfileDTO {
    phone: string;
    photo: string;
    user: User;
}

export type UpdateProfileDTO = Partial<CreateProfileDTO>;