import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import type { CreateUserDTO, UpdateUserDTO, User } from "@/core/domain/entities/security/User";
import { GetUserUseCase } from "@/core/applications/security/user/getUserUseCase";
import { GetAllUsersUseCase } from "@/core/applications/security/user/getAllUsersUseCase";
import { PostUserUseCase } from "@/core/applications/security/user/postUserUseCase";
import { PutUserUseCase } from "@/core/applications/security/user/putUserUseCase";
import { DeleteUserUseCase } from "@/core/applications/security/user/deleteUserUseCase";
import { PostUserProfileUseCase } from "@/core/applications/security/user/postUserProfileUseCase";
import { DeleteUserProfileUseCase } from "@/core/applications/security/user/deleteUserProfileUseCase";
import { PostUserSessionUseCase } from "@/core/applications/security/user/postUserSessionUseCase";
import { DeleteUserSessionUseCase } from "@/core/applications/security/user/deleteUserSessionUseCase";
import { UserRepository } from "@/infra/repository/security";
import type { MessageResponse } from "@/core/types/MessageResponse";

const userRepository = new UserRepository();
const getUserUseCase = new GetUserUseCase(userRepository);
const getAllUsersUseCase = new GetAllUsersUseCase(userRepository);
const postUserUseCase = new PostUserUseCase(userRepository);
const putUserUseCase = new PutUserUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const postUserProfileUseCase = new PostUserProfileUseCase(userRepository);
const deleteUserProfileUseCase = new DeleteUserProfileUseCase(userRepository);
const postUserSessionUseCase = new PostUserSessionUseCase(userRepository);
const deleteUserSessionUseCase = new DeleteUserSessionUseCase(userRepository);

interface UserStoreState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUser: (userId: string) => Promise<User>;
  fetchAllUsers: () => Promise<User[]>;
  createUser: (userData: CreateUserDTO) => Promise<User>;
  updateUser: (userId: string, userData: UpdateUserDTO) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  assignProfileToUser: (userId: string, profileId: string) => Promise<MessageResponse>;
  removeProfileFromUser: (userId: string, profileId: string) => Promise<void>;
  assignSessionToUser: (userId: string, sessionId: string) => Promise<MessageResponse>;
  removeSessionFromUser: (userId: string, sessionId: string) => Promise<void>;
}

export const useUserStore = create<UserStoreState>((set) => ({
  users: [],
  loading: false,
  error: null,
  fetchUser: async (userId: string) => {
    const loadingToastId = showLoadingToast("Cargando usuario...");
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        showErrorToast("User ID is required");
        throw new Error("User ID is required");
      }
      const user = await getUserUseCase.execute(userId);
      showSuccessToast("User fetched successfully");
      set({ loading: false });
      return user;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error fetching user: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  fetchAllUsers: async () => {
    const loadingToastId = showLoadingToast("Cargando usuarios...");
    set({ loading: true, error: null });
    try {
      const users = await getAllUsersUseCase.execute();
      set({ loading: false, users });
      showSuccessToast("Users fetched successfully");
      return users;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error fetching users: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  createUser: async (userData: CreateUserDTO) => {
    const loadingToastId = showLoadingToast("Creando usuario...");
    set({ loading: true, error: null });
    try {
      const user = await postUserUseCase.execute(userData);
      set({ loading: false });
      showSuccessToast("User created successfully");
      return user;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error creating user: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  updateUser: async (userId: string, userData: UpdateUserDTO) => {
    const loadingToastId = showLoadingToast("Actualizando usuario...");
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        showErrorToast("User ID is required");
        throw new Error("User ID is required");
      }
      const user = await putUserUseCase.execute(userId, userData);
      set({ loading: false });
      showSuccessToast("User updated successfully");
      return user;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error updating user: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  deleteUser: async (userId: string) => {
    const loadingToastId = showLoadingToast("Eliminando usuario...");
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        showErrorToast("User ID is required");
        throw new Error("User ID is required");
      }
      await deleteUserUseCase.execute(userId);
      set({ loading: false });
      showSuccessToast("User deleted successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error deleting user: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  assignProfileToUser: async (userId: string, profileId: string) => {
    const loadingToastId = showLoadingToast("Asignando perfil...");
    set({ loading: true, error: null });
    try {
      const response = await postUserProfileUseCase.execute(userId, profileId);
      set({ loading: false });
      showSuccessToast("Profile assigned successfully");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error assigning profile: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  removeProfileFromUser: async (userId: string, profileId: string) => {
    const loadingToastId = showLoadingToast("Removiendo perfil...");
    set({ loading: true, error: null });
    try {
      await deleteUserProfileUseCase.execute(userId, profileId);
      set({ loading: false });
      showSuccessToast("Profile removed successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error removing profile: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  assignSessionToUser: async (userId: string, sessionId: string) => {
    const loadingToastId = showLoadingToast("Asignando sesion...");
    set({ loading: true, error: null });
    try {
      const response = await postUserSessionUseCase.execute(userId, sessionId);
      set({ loading: false });
      showSuccessToast("Session assigned successfully");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error assigning session: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  removeSessionFromUser: async (userId: string, sessionId: string) => {
    const loadingToastId = showLoadingToast("Removiendo sesion...");
    set({ loading: true, error: null });
    try {
      await deleteUserSessionUseCase.execute(userId, sessionId);
      set({ loading: false });
      showSuccessToast("Session removed successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error removing session: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
