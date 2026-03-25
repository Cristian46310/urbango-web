import type { CreateSessionDTO, Session } from "@/core/domain/entities/security/Session";
import type { ISessionRepository } from "@/core/domain/interfaces/security/ISessionRepository";

export class PostSessionUseCase {
  private sessionRepository: ISessionRepository;

  constructor(sessionRepository: ISessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async execute(sessionData: CreateSessionDTO): Promise<Session> {
    return await this.sessionRepository.postSession(sessionData);
  }
}