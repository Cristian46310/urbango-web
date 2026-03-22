import type { Profile } from "@/core/domain/entities/security/Profile";

export interface IProfileRepository {
  deleteProfile(profileId: string): Promise<void>;
  putProfile(profileId: string, profileData: Profile): Promise<Profile>;
  getProfile(profileId: string): Promise<Profile>;
  getAllProfiles(): Promise<Profile[]>;
  postProfile(profileData: Profile): Promise<Profile>;

}