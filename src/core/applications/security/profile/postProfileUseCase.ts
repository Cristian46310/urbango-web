import type { Profile } from "@/core/domain/entities/security/Profile";
import type { IProfileRepository } from "@/core/domain/interfaces/security/IProfileRepository";

export class PostProfileUseCase {
  private profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(profileData: Profile): Promise<Profile> {
    return await this.profileRepository.postProfile(profileData);
  }
}