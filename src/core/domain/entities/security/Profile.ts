import type { User } from "./User";

export interface Profile {
    id: string;
    phone: string;
    photo: string;
    user: User
}

export interface CreateProfileDTO extends Omit<Profile, 'id'> {}

export interface UpdateProfileDTO extends Partial<CreateProfileDTO> {}