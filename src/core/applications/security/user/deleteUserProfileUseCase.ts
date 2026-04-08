import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";

export class DeleteUserProfileUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string, profileId: string): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!profileId) {
      throw new Error("Profile ID is required");
    }
    await this.userRepository.deleteUserProfile(userId, profileId);
  }
}