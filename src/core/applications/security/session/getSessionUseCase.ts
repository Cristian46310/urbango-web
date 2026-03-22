import type { Session } from "@/core/domain/entities/security/Session";
import type { ISessionRepository } from "@/core/domain/interfaces/security/ISessionRepository";

export class GetSessionUseCase {
  private sessionRepository: ISessionRepository;

  constructor(sessionRepository: ISessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async execute(sessionId: string): Promise<Session> {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    return await this.sessionRepository.getSession(sessionId);
  }
}