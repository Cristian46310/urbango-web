import type { User } from "./User";

export interface Profile {
    id: string;
    phone: string;
    photo: string;
    user: User
}

export type CreateProfileDTO = Omit<Profile, 'id'>;

export type UpdateProfileDTO = Partial<CreateProfileDTO>;