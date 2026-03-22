import type { IProfileRepository } from "@/core/domain/interfaces/security/IProfileRepository";
import type { Profile } from "@/core/domain/entities/security/Profile";

export class PutProfileUseCase {
  private profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(profileId: string, profileData: Profile): Promise<Profile> {
    if (!profileId) {
      throw new Error("Profile ID is required");
    }
    return await this.profileRepository.putProfile(profileId, profileData);
  }
}