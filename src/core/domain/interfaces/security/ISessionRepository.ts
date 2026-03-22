import type { Session } from "@/core/domain/entities/security/Session";

export interface ISessionRepository {
  deleteSession(sessionId: string): Promise<void>;
  putSession(sessionId: string, sessionData: Session): Promise<Session>;
  getSession(sessionId: string): Promise<Session>;
  getAllSessions(): Promise<Session[]>;
  postSession(sessionData: Session): Promise<Session>;
}