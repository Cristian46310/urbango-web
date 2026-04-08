import type { CreateProfileDTO, Profile, UpdateProfileDTO } from "@/core/domain/entities/security/Profile";

export interface IProfileRepository {
  deleteProfile(profileId: string): Promise<void>;
  putProfile(profileId: string, profileData: UpdateProfileDTO): Promise<Profile>;
  getProfile(profileId: string): Promise<Profile>;
  getAllProfiles(): Promise<Profile[]>;
  postProfile(profileData: CreateProfileDTO): Promise<Profile>;
}
