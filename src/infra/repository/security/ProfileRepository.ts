import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { Profile } from "@/core/domain/entities/security/Profile";
import type { IProfileRepository } from "@/core/domain/interfaces/security/IProfileRepository";

export class ProfileRepository implements IProfileRepository {
  async deleteProfile(profileId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(ENDPOINTS.PROFILE.BY_ID(profileId));
  }

  async putProfile(profileId: string, profileData: Profile): Promise<Profile> {
    return await httpMsSecurity.put<Profile>(
      ENDPOINTS.PROFILE.BY_ID(profileId),
      profileData,
    );
  }

  async getProfile(profileId: string): Promise<Profile> {
    return await httpMsSecurity.get<Profile>(ENDPOINTS.PROFILE.BY_ID(profileId));
  }

  async getAllProfiles(): Promise<Profile[]> {
    return await httpMsSecurity.get<Profile[]>(ENDPOINTS.PROFILE.BASE);
  }

  async postProfile(profileData: Profile): Promise<Profile> {
    return await httpMsSecurity.post<Profile>(ENDPOINTS.PROFILE.BASE, profileData);
  }
}

export const profileRepository = new ProfileRepository();
