import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import type { CreateSessionDTO, Session, UpdateSessionDTO } from "@/core/domain/entities/security/Session";
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
  createSession: (sessionData: CreateSessionDTO) => Promise<Session>;
  updateSession: (sessionId: string, sessionData: UpdateSessionDTO) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  sessions: [],
  loading: false,
  error: null,
  fetchSession: async (sessionId: string) => {
    const loadingToastId = showLoadingToast("Cargando sesion...");
    set({ loading: true, error: null });
    try {
      if (!sessionId || sessionId.trim() === "") {
        set({ loading: false, error: "Session ID is required" });
        showErrorToast("Session ID is required");
        throw new Error("Session ID is required");
      }
      const session = await getSessionUseCase.execute(sessionId);
      set({ loading: false });
      return session;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error fetching session: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  fetchAllSessions: async () => {
    const loadingToastId = showLoadingToast("Cargando sesiones...");
    set({ loading: true, error: null });
    try {
      const sessions = await getAllSessionsUseCase.execute();
      set({ loading: false, sessions });
      return sessions;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error fetching sessions: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  createSession: async (sessionData: CreateSessionDTO) => {
    const loadingToastId = showLoadingToast("Creando sesion...");
    set({ loading: true, error: null });
    try {
      const session = await postSessionUseCase.execute(sessionData);
      set({ loading: false });
      showSuccessToast("Session created successfully");
      return session;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error creating session: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  updateSession: async (sessionId: string, sessionData: UpdateSessionDTO) => {
    const loadingToastId = showLoadingToast("Actualizando sesion...");
    set({ loading: true, error: null });
    try {
      if (!sessionId || sessionId.trim() === "") {
        set({ loading: false, error: "Session ID is required" });
        showErrorToast("Session ID is required");
        throw new Error("Session ID is required");
      }
      const session = await putSessionUseCase.execute(sessionId, sessionData);
      set({ loading: false });
      showSuccessToast("Session updated successfully");
      return session;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error updating session: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  deleteSession: async (sessionId: string) => {
    const loadingToastId = showLoadingToast("Eliminando sesion...");
    set({ loading: true, error: null });
    try {
      if (!sessionId || sessionId.trim() === "") {
        set({ loading: false, error: "Session ID is required" });
        showErrorToast("Session ID is required");
        throw new Error("Session ID is required");
      }
      await deleteSessionUseCase.execute(sessionId);
      set({ loading: false });
      showSuccessToast("Session deleted successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error deleting session: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
