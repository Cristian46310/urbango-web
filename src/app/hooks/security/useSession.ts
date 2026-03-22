import { useSessionStore } from "@/app/store";
import type { Session } from "@/core/domain/entities/security/Session";

export function useSession() {
  const {
    sessions,
    loading,
    error,
    fetchSession,
    fetchAllSessions,
    createSession,
    updateSession,
    deleteSession,
  } = useSessionStore();

  return {
    sessions,
    loading,
    error,
    loadSessions: () => fetchAllSessions(),
    getSessionById: (sessionId: string) => fetchSession(sessionId),
    addSession: (sessionData: Session) => createSession(sessionData),
    editSession: (sessionId: string, sessionData: Session) => updateSession(sessionId, sessionData),
    removeSession: (sessionId: string) => deleteSession(sessionId),
  };
}
