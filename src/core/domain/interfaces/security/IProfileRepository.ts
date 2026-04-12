import type { CreateProfileDTO, Profile, UpdateProfileDTO } from "@/core/domain/entities/security/Profile";
import type { Page, PageableQuery } from "@/core/types/Page";

export interface IProfileRepository {
  deleteProfile(profileId: string): Promise<void>;
  putProfile(profileId: string, profileData: UpdateProfileDTO): Promise<Profile>;
  getProfile(profileId: string): Promise<Profile>;
  getAllProfiles(pageable: PageableQuery): Promise<Page<Profile>>;
  postProfile(profileData: CreateProfileDTO): Promise<Profile>;
}
