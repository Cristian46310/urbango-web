import { toast } from "sonner";
import { create } from "zustand";
import type { Session } from "@/core/domain/entities/security/Session";
import { GetSessionUseCase } from "@/core/applications/security/session/getSessionUseCase";
import { GetAllSessionsUseCase } from "@/core/applications/security/session/getAllSessionsUseCase";
import { PostSessionUseCase } from "@/core/applications/security/session/postSessionUseCase";
import { PutSessionUseCase } from "@/core/applications/security/session/putSessionUseCase";
import { DeleteSessionUseCase } from "@/core/applications/security/session/deleteSessionUseCase";
import { SessionRepository } from "@/infra/repository/security";

const sessionRepository = new SessionRepository();
const getSessionUseCase = new GetSessionUseCase(sessionRepository);
const getAllSessionsUseCase = new GetAllSessionsUseCase(sessionRepository);
const postSessionUseCase = new PostSessionUseCase(sessionRepository);
const putSessionUseCase = new PutSessionUseCase(sessionRepository);
const deleteSessionUseCase = new DeleteSessionUseCase(sessionRepository);

interface SessionStoreState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  fetchSession: (sessionId: string) => Promise<Session>;
  fetchAllSessions: () => Promise<Session[]>;
  createSession: (sessionData: Session) => Promise<Session>;
  updateSession: (sessionId: string, sessionData: Session) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  sessions: [],
  loading: false,
  error: null,
  fetchSession: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      if (!sessionId || sessionId.trim() === "") {
        set({ loading: false, error: "Session ID is required" });
        toast.error("Session ID is required");
        throw new Error("Session ID is required");
      }
      const session = await getSessionUseCase.execute(sessionId);
      set({ loading: false });
      return session;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching session: ${(error as Error).message}`);
      throw error;
    }
  },
  fetchAllSessions: async () => {
    set({ loading: true, error: null });
    try {
      const sessions = await getAllSessionsUseCase.execute();
      set({ loading: false, sessions });
      return sessions;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching sessions: ${(error as Error).message}`);
      throw error;
    }
  },
  createSession: async (sessionData: Session) => {
    set({ loading: true, error: null });
    try {
      const session = await postSessionUseCase.execute(sessionData);
      set({ loading: false });
      return session;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error creating session: ${(error as Error).message}`);
      throw error;
    }
  },
  updateSession: async (sessionId: string, sessionData: Session) => {
    set({ loading: true, error: null });
    try {
      if (!sessionId || sessionId.trim() === "") {
        set({ loading: false, error: "Session ID is required" });
        toast.error("Session ID is required");
        throw new Error("Session ID is required");
      }
      const session = await putSessionUseCase.execute(sessionId, sessionData);
      set({ loading: false });
      return session;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error updating session: ${(error as Error).message}`);
      throw error;
    }
  },
  deleteSession: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      if (!sessionId || sessionId.trim() === "") {
        set({ loading: false, error: "Session ID is required" });
        toast.error("Session ID is required");
        throw new Error("Session ID is required");
      }
      await deleteSessionUseCase.execute(sessionId);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error deleting session: ${(error as Error).message}`);
      throw error;
    }
  },
}));
