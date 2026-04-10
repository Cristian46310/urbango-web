import { toast } from "sonner";
import { create } from "zustand";
import { LoginRepository } from "@/infra/repository/security/LoginRepository";
import { AuthorizeGithubLoginUseCase } from "@/core/applications/security/login/authorizeGithubLoginUseCase";
import { CompleteGithubRegistrationUseCase } from "@/core/applications/security/login/completeGithubRegistrationUseCase";
import { LoginUseCase } from "@/core/applications/security/login/loginUseCase";
import { LoginWithGithubUseCase } from "@/core/applications/security/login/loginWithGithubUseCase";
import { LoginWithGoogleUseCase } from "@/core/applications/security/login/loginWithGoogleUseCase";
import { VerifyTwoFactorUseCase } from "@/core/applications/security/login/verifyTwoFactorUseCase";
import type {
  login,
  LoginChallengeResponse,
  LoginGithubAuthorizeResponse,
  LoginGithubCallback,
  LoginGithubCompleteRegistration,
  LoginGithubResponse,
  LoginGoogle,
  LoginResponse,
  Verify2FADTO,
} from "@/core/domain/entities/security/Login";

const loginRepository = new LoginRepository();
const authorizeGithubLoginUseCase = new AuthorizeGithubLoginUseCase(loginRepository);
const completeGithubRegistrationUseCase = new CompleteGithubRegistrationUseCase(loginRepository);
const loginUseCase = new LoginUseCase(loginRepository);
const loginWithGithubUseCase = new LoginWithGithubUseCase(loginRepository);
const loginWithGoogleUseCase = new LoginWithGoogleUseCase(loginRepository);
const verifyTwoFactorUseCase = new VerifyTwoFactorUseCase(loginRepository);

interface LoginStoreState {
  loading: boolean;
  error: string | null;
  login: (credentials: login) => Promise<LoginChallengeResponse>;
  verifyTwoFactor: (payload: Verify2FADTO) => Promise<LoginResponse>;
  loginWithGoogle: (payload: LoginGoogle) => Promise<LoginResponse>;
  authorizeGithubLogin: () => Promise<LoginGithubAuthorizeResponse>;
  loginWithGithub: (payload: LoginGithubCallback) => Promise<LoginGithubResponse>;
  completeGithubRegistration: (
    payload: LoginGithubCompleteRegistration,
  ) => Promise<LoginGithubResponse>;
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
  loginWithGoogle: async (payload: LoginGoogle) => {
    set({ loading: true, error: null });
    try {
      if (!payload.idToken) {
        set({ loading: false, error: "ID Token is required" });
        toast.error("ID Token is required");
        throw new Error("ID Token is required");
      }

      const response = await loginWithGoogleUseCase.execute(payload);
      localStorage.setItem("authToken", response.token);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Google login failed: ${(error as Error).message}`);
      throw error;
    }
  },
  authorizeGithubLogin: async () => {
    set({ loading: true, error: null });
    try {
      const response = await authorizeGithubLoginUseCase.execute();
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`GitHub authorize failed: ${(error as Error).message}`);
      throw error;
    }
  },
  loginWithGithub: async (payload: LoginGithubCallback) => {
    set({ loading: true, error: null });
    try {
      const response = await loginWithGithubUseCase.execute(payload);
      if (response.status === "AUTHENTICATED" && response.token) {
        localStorage.setItem("authToken", response.token);
      }
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`GitHub login failed: ${(error as Error).message}`);
      throw error;
    }
  },
  completeGithubRegistration: async (payload: LoginGithubCompleteRegistration) => {
    set({ loading: true, error: null });
    try {
      const response = await completeGithubRegistrationUseCase.execute(payload);
      if (response.status === "AUTHENTICATED" && response.token) {
        localStorage.setItem("authToken", response.token);
      }
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`GitHub registration failed: ${(error as Error).message}`);
      throw error;
    }
  },
}));
