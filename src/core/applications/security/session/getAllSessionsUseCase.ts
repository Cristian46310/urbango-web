import type { Session } from "@/core/domain/entities/security/Session";
import type { ISessionRepository } from "@/core/domain/interfaces/security/ISessionRepository";

export class GetAllSessionsUseCase {
  private sessionRepository: ISessionRepository;

  constructor(sessionRepository: ISessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async execute(): Promise<Session[]> {
    return await this.sessionRepository.getAllSessions();
  }
}