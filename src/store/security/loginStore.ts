import { toast } from "sonner";
import { create } from "zustand";
import { LoginRepository } from "@/infra/repository/security/LoginRepository";
import { LoginUseCase } from "@/core/applications/security/login/loginUseCase";
import { VerifyTwoFactorUseCase } from "@/core/applications/security/login/verifyTwoFactorUseCase";
import type {
  login,
  LoginChallengeResponse,
  LoginResponse,
  Verify2FADTO,
} from "@/core/domain/entities/security/Login";

const loginRepository = new LoginRepository();
const loginUseCase = new LoginUseCase(loginRepository);
const verifyTwoFactorUseCase = new VerifyTwoFactorUseCase(loginRepository);

interface LoginStoreState {
  loading: boolean;
  error: string | null;
  login: (credentials: login) => Promise<LoginChallengeResponse>;
  verifyTwoFactor: (payload: Verify2FADTO) => Promise<LoginResponse>;
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
  verifyTwoFactor: async (payload: Verify2FADTO) => {
    set({ loading: true, error: null });
    try {
      if (!payload.challengeToken || !payload.code) {
        set({ loading: false, error: "Challenge token and 2FA code are required" });
        toast.error("Challenge token and 2FA code are required");
        throw new Error("Challenge token and 2FA code are required");
      }

      const response = await verifyTwoFactorUseCase.execute(payload);
      localStorage.setItem("authToken", response.token);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`2FA validation failed: ${(error as Error).message}`);
      throw error;
    }
  },
}));
