import type { CreateProfileDTO, Profile } from "@/core/domain/entities/security/Profile";
import type { IProfileRepository } from "@/core/domain/interfaces/security/IProfileRepository";

export class PostProfileUseCase {
  private profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(profileData: CreateProfileDTO): Promise<Profile> {
    return await this.profileRepository.postProfile(profileData);
  }
}