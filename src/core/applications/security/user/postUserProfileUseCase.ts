import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";
import type { MessageResponse } from "@/core/types/MessageResponse";

export class PostUserProfileUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string, profileId: string): Promise<MessageResponse> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!profileId) {
      throw new Error("Profile ID is required");
    }
    return await this.userRepository.postUserProfile(userId, profileId);
  }
}