import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";

export class PostUserSessionUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string, sessionId: string): Promise<unknown> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    return await this.userRepository.postUserSession(userId, sessionId);
  }
}