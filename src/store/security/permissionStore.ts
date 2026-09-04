import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
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
import type { Page, PageableQuery } from "@/core/types/Page";

const permissionRepository = new PermissionRepository();
const getPermissionUseCase = new GetPermissionUseCase(permissionRepository);
const getAllPermissionsUseCase = new GetAllPermissionsUseCase(permissionRepository);
const postPermissionUseCase = new PostPermissionUseCase(permissionRepository);
const putPermissionUseCase = new PutPermissionUseCase(permissionRepository);
const deletePermissionUseCase = new DeletePermissionUseCase(permissionRepository);

interface PermissionStoreState {
  permissions: Permission[];
  permissionsPage: Page<Permission> | null;
  loading: boolean;
  error: string | null;
  fetchPermission: (permissionId: string) => Promise<Permission>;
  fetchAllPermissions: (pageable?: PageableQuery) => Promise<Page<Permission>>;
  createPermission: (permissionData: CreatePermissionDTO) => Promise<Permission>;
  updatePermission: (permissionId: string, permissionData: UpdatePermissionDTO) => Promise<Permission>;
  deletePermission: (permissionId: string) => Promise<void>;
}

export const usePermissionStore = create<PermissionStoreState>((set) => ({
  permissions: [],
  permissionsPage: null,
  loading: false,
  error: null,
  fetchPermission: async (permissionId: string) => {
    const loadingToastId = showLoadingToast("Cargando permiso...", "permissions:load-one");
    set({ loading: true, error: null });
    try {
      if (!permissionId || permissionId.trim() === "") {
        set({ loading: false, error: "Permission ID is required" });
        throw new Error("Permission ID is required");
      }
      const permission = await getPermissionUseCase.execute(permissionId);
      set({ loading: false });
      return permission;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  fetchAllPermissions: async (pageable = { page: 0, limit: 10 }) => {
    const loadingToastId = showLoadingToast("Cargando permisos...", "permissions:load-all");
    set({ loading: true, error: null });
    try {
      const permissionsPage = await getAllPermissionsUseCase.execute(pageable);
      set({ loading: false, permissions: permissionsPage.content, permissionsPage });
      return permissionsPage;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  createPermission: async (permissionData: CreatePermissionDTO) => {
    const loadingToastId = showLoadingToast("Creando permiso...", "permissions:create");
    set({ loading: true, error: null });
    try {
      const permission = await postPermissionUseCase.execute(permissionData);
      set({ loading: false });
      showSuccessToast("Permission created successfully", "permissions:create-ok");
      return permission;
    } catch (error) {
      set({ loading: false, error: null });
      showErrorToast(`Error creating permission: ${(error as Error).message}`, "permissions:create-err");
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  updatePermission: async (permissionId: string, permissionData: UpdatePermissionDTO) => {
    const loadingToastId = showLoadingToast("Actualizando permiso...", "permissions:update");
    set({ loading: true, error: null });
    try {
      if (!permissionId || permissionId.trim() === "") {
        set({ loading: false, error: null });
        showErrorToast("Permission ID is required", "permissions:update-err");
        throw new Error("Permission ID is required");
      }
      const permission = await putPermissionUseCase.execute(permissionId, permissionData);
      set({ loading: false });
      showSuccessToast("Permission updated successfully", "permissions:update-ok");
      return permission;
    } catch (error) {
      set({ loading: false, error: null });
      showErrorToast(`Error updating permission: ${(error as Error).message}`, "permissions:update-err");
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  deletePermission: async (permissionId: string) => {
    const loadingToastId = showLoadingToast("Eliminando permiso...", "permissions:delete");
    set({ loading: true, error: null });
    try {
      if (!permissionId || permissionId.trim() === "") {
        set({ loading: false, error: null });
        showErrorToast("Permission ID is required", "permissions:delete-err");
        throw new Error("Permission ID is required");
      }
      await deletePermissionUseCase.execute(permissionId);
      set({ loading: false });
      showSuccessToast("Permission deleted successfully", "permissions:delete-ok");
    } catch (error) {
      set({ loading: false, error: null });
      showErrorToast(`Error deleting permission: ${(error as Error).message}`, "permissions:delete-err");
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
