import { toast } from "sonner";
import { create } from "zustand";
import type { Role } from "@/core/domain/entities/security/Role";
import { GetRoleUseCase } from "@/core/applications/security/role/getRoleUseCase";
import { GetAllRolesUseCase } from "@/core/applications/security/role/getAllRolesUseCase";
import { PostRoleUseCase } from "@/core/applications/security/role/postRoleUseCase";
import { PutRoleUseCase } from "@/core/applications/security/role/putRoleUseCase";
import { DeleteRoleUseCase } from "@/core/applications/security/role/deleteRoleUseCase";
import { RoleRepository } from "@/app/infra/repository/security";

const roleRepository = new RoleRepository();
const getRoleUseCase = new GetRoleUseCase(roleRepository);
const getAllRolesUseCase = new GetAllRolesUseCase(roleRepository);
const postRoleUseCase = new PostRoleUseCase(roleRepository);
const putRoleUseCase = new PutRoleUseCase(roleRepository);
const deleteRoleUseCase = new DeleteRoleUseCase(roleRepository);

interface RoleStoreState {
  roles: Role[];
  loading: boolean;
  error: string | null;
  fetchRole: (roleId: string) => Promise<Role>;
  fetchAllRoles: () => Promise<Role[]>;
  createRole: (roleData: Role) => Promise<Role>;
  updateRole: (roleId: string, roleData: Role) => Promise<Role>;
  deleteRole: (roleId: string) => Promise<void>;
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
  createRole: async (roleData: Role) => {
    set({ loading: true, error: null });
    try {
      const role = await postRoleUseCase.execute(roleData);
      set({ loading: false });
      return role;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error creating role: ${(error as Error).message}`);
      throw error;
    }
  },
  updateRole: async (roleId: string, roleData: Role) => {
    set({ loading: true, error: null });
    try {
      if (!roleId || roleId.trim() === "") {
        set({ loading: false, error: "Role ID is required" });
        toast.error("Role ID is required");
        throw new Error("Role ID is required");
      }
      const role = await putRoleUseCase.execute(roleId, roleData);
      set({ loading: false });
      return role;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error updating role: ${(error as Error).message}`);
      throw error;
    }
  },
  deleteRole: async (roleId: string) => {
    set({ loading: true, error: null });
    try {
      if (!roleId || roleId.trim() === "") {
        set({ loading: false, error: "Role ID is required" });
        toast.error("Role ID is required");
        throw new Error("Role ID is required");
      }
      await deleteRoleUseCase.execute(roleId);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error deleting role: ${(error as Error).message}`);
      throw error;
    }
  },
}));
