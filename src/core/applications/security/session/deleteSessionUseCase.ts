import type { ISessionRepository } from "@/core/domain/interfaces/security/ISessionRepository";

export class DeleteSessionUseCase {
  private sessionRepository: ISessionRepository;

  constructor(sessionRepository: ISessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async execute(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    await this.sessionRepository.deleteSession(sessionId);
  }
}