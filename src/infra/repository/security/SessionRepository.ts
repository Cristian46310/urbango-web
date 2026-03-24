import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { Session } from "@/core/domain/entities/security/Session";
import type { ISessionRepository } from "@/core/domain/interfaces/security/ISessionRepository";

export class SessionRepository implements ISessionRepository {
  async deleteSession(sessionId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(ENDPOINTS.SESSION.BY_ID(sessionId));
  }

  async putSession(sessionId: string, sessionData: Session): Promise<Session> {
    return await httpMsSecurity.put<Session>(
      ENDPOINTS.SESSION.BY_ID(sessionId),
      sessionData,
    );
  }

  async getSession(sessionId: string): Promise<Session> {
    return await httpMsSecurity.get<Session>(ENDPOINTS.SESSION.BY_ID(sessionId));
  }

  async getAllSessions(): Promise<Session[]> {
    return await httpMsSecurity.get<Session[]>(ENDPOINTS.SESSION.BASE);
  }

  async postSession(sessionData: Session): Promise<Session> {
    return await httpMsSecurity.post<Session>(ENDPOINTS.SESSION.BASE, sessionData);
  }
}

export const sessionRepository = new SessionRepository();