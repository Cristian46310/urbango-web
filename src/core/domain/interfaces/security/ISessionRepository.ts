import type { CreateSessionDTO, Session, UpdateSessionDTO } from "@/core/domain/entities/security/Session";

export interface ISessionRepository {
  deleteSession(sessionId: string): Promise<void>;
  putSession(sessionId: string, sessionData: UpdateSessionDTO): Promise<Session>;
  getSession(sessionId: string): Promise<Session>;
  getAllSessions(): Promise<Session[]>;
  postSession(sessionData: CreateSessionDTO): Promise<Session>;
}