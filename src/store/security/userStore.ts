import { toast } from "sonner";
import { create } from "zustand";
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
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        toast.error("User ID is required");
        throw new Error("User ID is required");
      }
      const user = await getUserUseCase.execute(userId);
      set({ loading: false });
      return user;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching user: ${(error as Error).message}`);
      throw error;
    }
  },
  fetchAllUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await getAllUsersUseCase.execute();
      set({ loading: false, users });
      return users;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching users: ${(error as Error).message}`);
      throw error;
    }
  },
  createUser: async (userData: CreateUserDTO) => {
    set({ loading: true, error: null });
    try {
      const user = await postUserUseCase.execute(userData);
      set({ loading: false });
      return user;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error creating user: ${(error as Error).message}`);
      throw error;
    }
  },
  updateUser: async (userId: string, userData: UpdateUserDTO) => {
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        toast.error("User ID is required");
        throw new Error("User ID is required");
      }
      const user = await putUserUseCase.execute(userId, userData);
      set({ loading: false });
      return user;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error updating user: ${(error as Error).message}`);
      throw error;
    }
  },
  deleteUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        toast.error("User ID is required");
        throw new Error("User ID is required");
      }
      await deleteUserUseCase.execute(userId);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error deleting user: ${(error as Error).message}`);
      throw error;
    }
  },
  assignProfileToUser: async (userId: string, profileId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await postUserProfileUseCase.execute(userId, profileId);
      set({ loading: false });
      toast.success("Profile assigned successfully");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error assigning profile: ${(error as Error).message}`);
      throw error;
    }
  },
  removeProfileFromUser: async (userId: string, profileId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteUserProfileUseCase.execute(userId, profileId);
      set({ loading: false });
      toast.success("Profile removed successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error removing profile: ${(error as Error).message}`);
      throw error;
    }
  },
  assignSessionToUser: async (userId: string, sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await postUserSessionUseCase.execute(userId, sessionId);
      set({ loading: false });
      toast.success("Session assigned successfully");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error assigning session: ${(error as Error).message}`);
      throw error;
    }
  },
  removeSessionFromUser: async (userId: string, sessionId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteUserSessionUseCase.execute(userId, sessionId);
      set({ loading: false });
      toast.success("Session removed successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error removing session: ${(error as Error).message}`);
      throw error;
    }
  },
}));
