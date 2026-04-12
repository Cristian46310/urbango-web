import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast } from "@/lib/toast";
import type { Role } from "@/core/domain/entities/security/Role";
import { GetRoleUseCase } from "@/core/applications/security/role/getRoleUseCase";
import { GetAllRolesUseCase } from "@/core/applications/security/role/getAllRolesUseCase";
import { RoleRepository } from "@/infra/repository/security";
import type { Page, PageableQuery } from "@/core/types/Page";

const roleRepository = new RoleRepository();
const getRoleUseCase = new GetRoleUseCase(roleRepository);
const getAllRolesUseCase = new GetAllRolesUseCase(roleRepository);

interface RoleStoreState {
  roles: Role[];
  rolesPage: Page<Role> | null;
  loading: boolean;
  error: string | null;
  fetchRole: (roleId: string) => Promise<Role>;
  fetchAllRoles: (pageable?: PageableQuery) => Promise<Page<Role>>;
}

export const useRoleStore = create<RoleStoreState>((set) => ({
  roles: [],
  rolesPage: null,
  loading: false,
  error: null,
  fetchRole: async (roleId: string) => {
    const loadingToastId = showLoadingToast("Cargando rol...");
    set({ loading: true, error: null });
    try {
      if (!roleId || roleId.trim() === "") {
        set({ loading: false, error: "Role ID is required" });
        showErrorToast("Role ID is required");
        throw new Error("Role ID is required");
      }
      const role = await getRoleUseCase.execute(roleId);
      set({ loading: false });
      return role;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error fetching role: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  fetchAllRoles: async (pageable = { page: 0, size: 10 }) => {
    const loadingToastId = showLoadingToast("Cargando roles...");
    set({ loading: true, error: null });
    try {
      const rolesPage = await getAllRolesUseCase.execute(pageable);
      set({ loading: false, roles: rolesPage.content, rolesPage });
      return rolesPage;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error fetching roles: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
