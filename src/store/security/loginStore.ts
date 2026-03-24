import { toast } from "sonner";
import { create } from "zustand";
import { LoginRepository } from "@/infra/repository/security/LoginRepository";
import { LoginUseCase } from "@/core/applications/security/login/loginUseCase";
import type {
  login,
  LoginResponse,
} from "@/core/domain/entities/security/Login";

const loginRepository = new LoginRepository();
const loginUseCase = new LoginUseCase(loginRepository);

interface LoginStoreState {
  loading: boolean;
  error: string | null;
  login: (credentials: login) => Promise<LoginResponse>;
}

export const useLoginStore = create<LoginStoreState>((set) => ({
  loading: false,
  error: null,
  login: async (credentials: login) => {
    set({ loading: true, error: null });
    try {
      if (!credentials.email || !credentials.password) {
        set({ loading: false, error: "Email and password are required" });
        toast.error("Email and password are required");
        throw new Error("Email and password are required");
      }
      const response = await loginUseCase.execute(credentials);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Login failed: ${(error as Error).message}`);
      throw error;
    }
  },
}));
