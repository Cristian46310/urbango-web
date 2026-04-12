import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import { PostUserRoleUseCase } from "@/core/applications/security/userRole/postUserRoleUseCase";
import { DeleteUserRoleUseCase } from "@/core/applications/security/userRole/deleteUserRoleUseCase";
import { AssignMultipleRolesUseCase } from "@/core/applications/security/userRole/assignMultipleRolesUseCase";
import { UserRoleRepository } from "@/infra/repository/security";
import type { AssignRolesDTO } from "@/core/domain/entities/security/User";

const userRoleRepository = new UserRoleRepository();
const postUserRoleUseCase = new PostUserRoleUseCase(userRoleRepository);
const deleteUserRoleUseCase = new DeleteUserRoleUseCase(userRoleRepository);
const assignMultipleRolesUseCase = new AssignMultipleRolesUseCase(userRoleRepository);

interface UserRoleStoreState {
  loading: boolean;
  error: string | null;
  assignRole: (userId: string, roleId: string) => Promise<void>;
  assignMultipleRoles: (payload: AssignRolesDTO) => Promise<void>;
  removeRole: (userRoleId: string) => Promise<void>;
}

export const useUserRoleStore = create<UserRoleStoreState>((set) => ({
  loading: false,
  error: null,
  assignRole: async (userId: string, roleId: string) => {
    const loadingToastId = showLoadingToast("Asignando rol...");
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        showErrorToast("User ID is required");
        throw new Error("User ID is required");
      }
      if (!roleId || roleId.trim() === "") {
        set({ loading: false, error: "Role ID is required" });
        showErrorToast("Role ID is required");
        throw new Error("Role ID is required");
      }
      await postUserRoleUseCase.execute(userId, roleId);
      set({ loading: false });
      showSuccessToast("Role assigned successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error assigning role: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  assignMultipleRoles: async (payload: AssignRolesDTO) => {
    const loadingToastId = showLoadingToast("Asignando multiples roles...");
    set({ loading: true, error: null });
    try {
      if (!payload.userId || payload.userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        showErrorToast("User ID is required");
        throw new Error("User ID is required");
      }
      if (!payload.roleIds.length) {
        set({ loading: false, error: "At least one role ID is required" });
        showErrorToast("At least one role ID is required");
        throw new Error("At least one role ID is required");
      }

      await assignMultipleRolesUseCase.execute(payload);
      set({ loading: false });
      showSuccessToast("Roles assigned successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error assigning roles: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  removeRole: async (userRoleId: string) => {
    const loadingToastId = showLoadingToast("Removiendo rol...");
    set({ loading: true, error: null });
    try {
      if (!userRoleId || userRoleId.trim() === "") {
        set({ loading: false, error: "User Role ID is required" });
        showErrorToast("User Role ID is required");
        throw new Error("User Role ID is required");
      }
      await deleteUserRoleUseCase.execute(userRoleId);
      set({ loading: false });
      showSuccessToast("Role removed successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error removing role: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
