import type { Session, UpdateSessionDTO } from "@/core/domain/entities/security/Session";
import type { ISessionRepository } from "@/core/domain/interfaces/security/ISessionRepository";

export class PutSessionUseCase {
  private sessionRepository: ISessionRepository;

  constructor(sessionRepository: ISessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async execute(sessionId: string, sessionData: UpdateSessionDTO): Promise<Session> {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    return await this.sessionRepository.putSession(sessionId, sessionData);
  }
}