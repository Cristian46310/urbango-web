import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import { AddRolePermissionUseCase } from "@/core/applications/security/rolePermission/addRolePermissionUseCase";
import { RemoveRolePermissionUseCase } from "@/core/applications/security/rolePermission/removeRolePermissionUseCase";
import { RolePermissionRepository } from "@/infra/repository/security";

const rolePermissionRepository = new RolePermissionRepository();
const addRolePermissionUseCase = new AddRolePermissionUseCase(rolePermissionRepository);
const removeRolePermissionUseCase = new RemoveRolePermissionUseCase(rolePermissionRepository);

interface RolePermissionStoreState {
  loading: boolean;
  error: string | null;
  addPermissionToRole: (roleId: string, permissionId: string) => Promise<void>;
  removePermissionFromRole: (rolePermissionId: string) => Promise<void>;
}

export const useRolePermissionStore = create<RolePermissionStoreState>((set) => ({
  loading: false,
  error: null,
  addPermissionToRole: async (roleId: string, permissionId: string) => {
    const loadingToastId = showLoadingToast("Asignando permiso al rol...");
    set({ loading: true, error: null });
    try {
      if (!roleId || roleId.trim() === "") {
        set({ loading: false, error: "Role ID is required" });
        showErrorToast("Role ID is required");
        throw new Error("Role ID is required");
      }
      if (!permissionId || permissionId.trim() === "") {
        set({ loading: false, error: "Permission ID is required" });
        showErrorToast("Permission ID is required");
        throw new Error("Permission ID is required");
      }

      await addRolePermissionUseCase.execute(roleId, permissionId);
      set({ loading: false });
      showSuccessToast("Permission assigned to role successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error assigning permission to role: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  removePermissionFromRole: async (rolePermissionId: string) => {
    const loadingToastId = showLoadingToast("Removiendo permiso del rol...");
    set({ loading: true, error: null });
    try {
      if (!rolePermissionId || rolePermissionId.trim() === "") {
        set({ loading: false, error: "Role Permission ID is required" });
        showErrorToast("Role Permission ID is required");
        throw new Error("Role Permission ID is required");
      }

      await removeRolePermissionUseCase.execute(rolePermissionId);
      set({ loading: false });
      showSuccessToast("Permission removed from role successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error removing permission from role: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
