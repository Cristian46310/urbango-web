import { toast } from "sonner";
import { create } from "zustand";
import { PostUserRoleUseCase } from "@/core/applications/security/userRole/postUserRoleUseCase";
import { DeleteUserRoleUseCase } from "@/core/applications/security/userRole/deleteUserRoleUseCase";
import { UserRoleRepository } from "@/app/infra/repository/security";

const userRoleRepository = new UserRoleRepository();
const postUserRoleUseCase = new PostUserRoleUseCase(userRoleRepository);
const deleteUserRoleUseCase = new DeleteUserRoleUseCase(userRoleRepository);

interface UserRoleStoreState {
  loading: boolean;
  error: string | null;
  assignRole: (userId: string, roleId: string) => Promise<void>;
  removeRole: (userRoleId: string) => Promise<void>;
}

export const useUserRoleStore = create<UserRoleStoreState>((set) => ({
  loading: false,
  error: null,
  assignRole: async (userId: string, roleId: string) => {
    set({ loading: true, error: null });
    try {
      if (!userId || userId.trim() === "") {
        set({ loading: false, error: "User ID is required" });
        toast.error("User ID is required");
        throw new Error("User ID is required");
      }
      if (!roleId || roleId.trim() === "") {
        set({ loading: false, error: "Role ID is required" });
        toast.error("Role ID is required");
        throw new Error("Role ID is required");
      }
      await postUserRoleUseCase.execute(userId, roleId);
      set({ loading: false });
      toast.success("Role assigned successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error assigning role: ${(error as Error).message}`);
      throw error;
    }
  },
  removeRole: async (userRoleId: string) => {
    set({ loading: true, error: null });
    try {
      if (!userRoleId || userRoleId.trim() === "") {
        set({ loading: false, error: "User Role ID is required" });
        toast.error("User Role ID is required");
        throw new Error("User Role ID is required");
      }
      await deleteUserRoleUseCase.execute(userRoleId);
      set({ loading: false });
      toast.success("Role removed successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error removing role: ${(error as Error).message}`);
      throw error;
    }
  },
}));
