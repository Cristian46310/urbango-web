import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import type { CreateUserDTO, UpdateUserDTO, User } from "@/core/domain/entities/security/User";
import { GetUserUseCase } from "@/core/applications/security/user/getUserUseCase";
import { GetAllUsersUseCase } from "@/core/applications/security/user/getAllUsersUseCase";
import { PostUserUseCase } from "@/core/applications/security/user/postUserUseCase";
import { PutUserUseCase } from "@/core/applications/security/user/putUserUseCase";
import { DeleteUserUseCase } from "@/core/applications/security/user/deleteUserUseCase";
import { PostUserSessionUseCase } from "@/core/applications/security/user/postUserSessionUseCase";
import { DeleteUserSessionUseCase } from "@/core/applications/security/user/deleteUserSessionUseCase";
import { UserRepository } from "@/infra/repository/security";
import type { MessageResponse } from "@/core/types/MessageResponse";
import type { Page, PageableQuery } from "@/core/types/Page";

const userRepository = new UserRepository();
const getUserUseCase = new GetUserUseCase(userRepository);
const getAllUsersUseCase = new GetAllUsersUseCase(userRepository);
const postUserUseCase = new PostUserUseCase(userRepository);
const putUserUseCase = new PutUserUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const postUserSessionUseCase = new PostUserSessionUseCase(userRepository);
const deleteUserSessionUseCase = new DeleteUserSessionUseCase(userRepository);

interface UserStoreState {
  users: User[];
  usersPage: Page<User> | null;
  loading: boolean;
  error: string | null;
  fetchUser: (userId: string) => Promise<User>;
  fetchAllUsers: (pageable?: PageableQuery) => Promise<Page<User>>;
  createUser: (userData: CreateUserDTO) => Promise<User>;
  updateUser: (userId: string, userData: UpdateUserDTO) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  assignSessionToUser: (userId: string, sessionId: string) => Promise<MessageResponse>;
  removeSessionFromUser: (userId: string, sessionId: string) => Promise<void>;
}

export const useUserStore = create<UserStoreState>((set) => ({
  users: [],
  usersPage: null,
  loading: false,
  error: null,
  fetchUser: async (userId: string) => {
    const loadingToastId = showLoadingToast("Cargando usuario...", "users:load-one");
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        throw new Error("User ID is required");
      }
      const user = await getUserUseCase.execute(userId);
      set({ loading: false });
      return user;
    } catch (error) {
      // Loads: DataTable banner only
      set({ loading: false, error: (error as Error).message });
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  fetchAllUsers: async (pageable = { page: 0, limit: 10 }) => {
    const loadingToastId = showLoadingToast("Cargando usuarios...", "users:load-all");
    set({ loading: true, error: null });
    try {
      const usersPage = await getAllUsersUseCase.execute(pageable);
      set({ loading: false, users: usersPage.content, usersPage });
      return usersPage;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  createUser: async (userData: CreateUserDTO) => {
    const loadingToastId = showLoadingToast("Creando usuario...", "users:create");
    set({ loading: true, error: null });
    try {
      const user = await postUserUseCase.execute(userData);
      set({ loading: false });
      showSuccessToast("User created successfully", "users:create-ok");
      return user;
    } catch (error) {
      set({ loading: false, error: null });
      showErrorToast(`Error creating user: ${(error as Error).message}`, "users:create-err");
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  updateUser: async (userId: string, userData: UpdateUserDTO) => {
    const loadingToastId = showLoadingToast("Actualizando usuario...", "users:update");
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: null });
        showErrorToast("User ID is required", "users:update-err");
        throw new Error("User ID is required");
      }
      const user = await putUserUseCase.execute(userId, userData);
      set({ loading: false });
      showSuccessToast("User updated successfully", "users:update-ok");
      return user;
    } catch (error) {
      set({ loading: false, error: null });
      showErrorToast(`Error updating user: ${(error as Error).message}`, "users:update-err");
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  deleteUser: async (userId: string) => {
    const loadingToastId = showLoadingToast("Eliminando usuario...", "users:delete");
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: null });
        showErrorToast("User ID is required", "users:delete-err");
        throw new Error("User ID is required");
      }
      await deleteUserUseCase.execute(userId);
      set({ loading: false });
      showSuccessToast("User deleted successfully", "users:delete-ok");
    } catch (error) {
      set({ loading: false, error: null });
      showErrorToast(`Error deleting user: ${(error as Error).message}`, "users:delete-err");
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  assignSessionToUser: async (userId: string, sessionId: string) => {
    const loadingToastId = showLoadingToast("Asignando sesion...", "users:assign-session");
    set({ loading: true, error: null });
    try {
      const response = await postUserSessionUseCase.execute(userId, sessionId);
      set({ loading: false });
      showSuccessToast("Session assigned successfully", "users:assign-session-ok");
      return response;
    } catch (error) {
      set({ loading: false, error: null });
      showErrorToast(`Error assigning session: ${(error as Error).message}`, "users:assign-session-err");
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  removeSessionFromUser: async (userId: string, sessionId: string) => {
    const loadingToastId = showLoadingToast("Removiendo sesion...", "users:remove-session");
    set({ loading: true, error: null });
    try {
      await deleteUserSessionUseCase.execute(userId, sessionId);
      set({ loading: false });
      showSuccessToast("Session removed successfully", "users:remove-session-ok");
    } catch (error) {
      set({ loading: false, error: null });
      showErrorToast(`Error removing session: ${(error as Error).message}`, "users:remove-session-err");
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
