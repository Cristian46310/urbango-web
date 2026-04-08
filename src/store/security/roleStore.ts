import { toast } from "sonner";
import { create } from "zustand";
import type { Role } from "@/core/domain/entities/security/Role";
import { GetRoleUseCase } from "@/core/applications/security/role/getRoleUseCase";
import { GetAllRolesUseCase } from "@/core/applications/security/role/getAllRolesUseCase";
import { RoleRepository } from "@/infra/repository/security";

const roleRepository = new RoleRepository();
const getRoleUseCase = new GetRoleUseCase(roleRepository);
const getAllRolesUseCase = new GetAllRolesUseCase(roleRepository);

interface RoleStoreState {
  roles: Role[];
  loading: boolean;
  error: string | null;
  fetchRole: (roleId: string) => Promise<Role>;
  fetchAllRoles: () => Promise<Role[]>;
}

export const useRoleStore = create<RoleStoreState>((set) => ({
  roles: [],
  loading: false,
  error: null,
  fetchRole: async (roleId: string) => {
    set({ loading: true, error: null });
    try {
      if (!roleId || roleId.trim() === "") {
        set({ loading: false, error: "Role ID is required" });
        toast.error("Role ID is required");
        throw new Error("Role ID is required");
      }
      const role = await getRoleUseCase.execute(roleId);
      set({ loading: false });
      return role;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching role: ${(error as Error).message}`);
      throw error;
    }
  },
  fetchAllRoles: async () => {
    set({ loading: true, error: null });
    try {
      const roles = await getAllRolesUseCase.execute();
      set({ loading: false, roles });
      return roles;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching roles: ${(error as Error).message}`);
      throw error;
    }
  },
}));
