import { useSessionStore } from "@/store";
import type { CreateSessionDTO, UpdateSessionDTO } from "@/core/domain/entities/security/Session";

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
    addSession: (sessionData: CreateSessionDTO) => createSession(sessionData),
    editSession: (sessionId: string, sessionData: UpdateSessionDTO) => updateSession(sessionId, sessionData),
    removeSession: (sessionId: string) => deleteSession(sessionId),
  };
}
