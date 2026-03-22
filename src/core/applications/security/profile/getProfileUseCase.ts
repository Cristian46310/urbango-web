import type { Profile } from "@/core/domain/entities/security/Profile";
import type { IProfileRepository } from "@/core/domain/interfaces/security/IProfileRepository";

export class GetProfileUseCase {
  private profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(profileId: string): Promise<Profile> {
    if (!profileId) {
      throw new Error("Profile ID is required");
    }
    return await this.profileRepository.getProfile(profileId);
  }
}