import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";

export class DeleteUserSessionUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string, sessionId: string): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    await this.userRepository.deleteUserSession(userId, sessionId);
  }
}