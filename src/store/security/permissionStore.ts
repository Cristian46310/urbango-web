import { toast } from "sonner";
import { create } from "zustand";
import type {
  CreatePermissionDTO,
  Permission,
  UpdatePermissionDTO,
} from "@/core/domain/entities/security/Permission";
import { GetPermissionUseCase } from "@/core/applications/security/permission/getPermissionUseCase";
import { GetAllPermissionsUseCase } from "@/core/applications/security/permission/getAllPermissionsUseCase";
import { PostPermissionUseCase } from "@/core/applications/security/permission/postPermissionUseCase";
import { PutPermissionUseCase } from "@/core/applications/security/permission/putPermissionUseCase";
import { DeletePermissionUseCase } from "@/core/applications/security/permission/deletePermissionUseCase";
import { PermissionRepository } from "@/infra/repository/security";

const permissionRepository = new PermissionRepository();
const getPermissionUseCase = new GetPermissionUseCase(permissionRepository);
const getAllPermissionsUseCase = new GetAllPermissionsUseCase(permissionRepository);
const postPermissionUseCase = new PostPermissionUseCase(permissionRepository);
const putPermissionUseCase = new PutPermissionUseCase(permissionRepository);
const deletePermissionUseCase = new DeletePermissionUseCase(permissionRepository);

interface PermissionStoreState {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  fetchPermission: (permissionId: string) => Promise<Permission>;
  fetchAllPermissions: () => Promise<Permission[]>;
  createPermission: (permissionData: CreatePermissionDTO) => Promise<Permission>;
  updatePermission: (permissionId: string, permissionData: UpdatePermissionDTO) => Promise<Permission>;
  deletePermission: (permissionId: string) => Promise<void>;
}

export const usePermissionStore = create<PermissionStoreState>((set) => ({
  permissions: [],
  loading: false,
  error: null,
  fetchPermission: async (permissionId: string) => {
    set({ loading: true, error: null });
    try {
      if (!permissionId || permissionId.trim() === "") {
        set({ loading: false, error: "Permission ID is required" });
        toast.error("Permission ID is required");
        throw new Error("Permission ID is required");
      }
      const permission = await getPermissionUseCase.execute(permissionId);
      set({ loading: false });
      return permission;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching permission: ${(error as Error).message}`);
      throw error;
    }
  },
  fetchAllPermissions: async () => {
    set({ loading: true, error: null });
    try {
      const permissions = await getAllPermissionsUseCase.execute();
      set({ loading: false, permissions });
      return permissions;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching permissions: ${(error as Error).message}`);
      throw error;
    }
  },
  createPermission: async (permissionData: CreatePermissionDTO) => {
    set({ loading: true, error: null });
    try {
      const permission = await postPermissionUseCase.execute(permissionData);
      set({ loading: false });
      return permission;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error creating permission: ${(error as Error).message}`);
      throw error;
    }
  },
  updatePermission: async (permissionId: string, permissionData: UpdatePermissionDTO) => {
    set({ loading: true, error: null });
    try {
      if (!permissionId || permissionId.trim() === "") {
        set({ loading: false, error: "Permission ID is required" });
        toast.error("Permission ID is required");
        throw new Error("Permission ID is required");
      }
      const permission = await putPermissionUseCase.execute(permissionId, permissionData);
      set({ loading: false });
      return permission;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error updating permission: ${(error as Error).message}`);
      throw error;
    }
  },
  deletePermission: async (permissionId: string) => {
    set({ loading: true, error: null });
    try {
      if (!permissionId || permissionId.trim() === "") {
        set({ loading: false, error: "Permission ID is required" });
        toast.error("Permission ID is required");
        throw new Error("Permission ID is required");
      }
      await deletePermissionUseCase.execute(permissionId);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error deleting permission: ${(error as Error).message}`);
      throw error;
    }
  },
}));
