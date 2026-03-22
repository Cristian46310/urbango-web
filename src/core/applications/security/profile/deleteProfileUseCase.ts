import type { IProfileRepository } from "@/core/domain/interfaces/security/IProfileRepository";

export class DeleteProfileUseCase {
  private profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(profileId: string): Promise<void> {
    if (!profileId) {
      throw new Error("Profile ID is required");
    }
    await this.profileRepository.deleteProfile(profileId);
  }
}