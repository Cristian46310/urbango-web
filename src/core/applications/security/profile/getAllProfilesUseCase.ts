import type { Profile } from "@/core/domain/entities/security/Profile";
import type { IProfileRepository } from "@/core/domain/interfaces/security/IProfileRepository";
import type { Page, PageableQuery } from "@/core/types/Page";

export class GetAllProfilesUseCase {
  private profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(pageable: PageableQuery): Promise<Page<Profile>> {
    return await this.profileRepository.getAllProfiles(pageable);
  }
}