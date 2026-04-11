import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
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
    const loadingToastId = showLoadingToast("Iniciando sesion...");
    set({ loading: true, error: null });
    try {
      if (!credentials.email || !credentials.password) {
        set({ loading: false, error: "Email and password are required" });
        showErrorToast("Email and password are required");
        throw new Error("Email and password are required");
      }
      const response = await loginUseCase.execute(credentials);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Login failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  verifyTwoFactor: async (payload: Verify2FADTO) => {
    const loadingToastId = showLoadingToast("Validando codigo 2FA...");
    set({ loading: true, error: null });
    try {
      if (!payload.challengeToken || !payload.code) {
        set({ loading: false, error: "Challenge token and 2FA code are required" });
        showErrorToast("Challenge token and 2FA code are required");
        throw new Error("Challenge token and 2FA code are required");
      }

      const response = await verifyTwoFactorUseCase.execute(payload);
      localStorage.setItem("authToken", response.token);
      set({ loading: false });
      showSuccessToast("2FA verification successful");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`2FA validation failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  loginWithGoogle: async (payload: LoginGoogle) => {
    const loadingToastId = showLoadingToast("Iniciando sesion con Google...");
    set({ loading: true, error: null });
    try {
      if (!payload.idToken) {
        set({ loading: false, error: "ID Token is required" });
        showErrorToast("ID Token is required");
        throw new Error("ID Token is required");
      }

      const response = await loginWithGoogleUseCase.execute(payload);
      localStorage.setItem("authToken", response.token);
      set({ loading: false });
      showSuccessToast("Google login successful");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Google login failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  authorizeGithubLogin: async () => {
    const loadingToastId = showLoadingToast("Autorizando GitHub...");
    set({ loading: true, error: null });
    try {
      const response = await authorizeGithubLoginUseCase.execute();
      set({ loading: false });
      showSuccessToast("GitHub authorization successful");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`GitHub authorize failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  loginWithGithub: async (payload: LoginGithubCallback) => {
    const loadingToastId = showLoadingToast("Iniciando sesion con GitHub...");
    set({ loading: true, error: null });
    try {
      const response = await loginWithGithubUseCase.execute(payload);
      if (response.status === "AUTHENTICATED" && response.token) {
        localStorage.setItem("authToken", response.token);
      }
      set({ loading: false });
      showSuccessToast("GitHub login successful");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`GitHub login failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  completeGithubRegistration: async (payload: LoginGithubCompleteRegistration) => {
    const loadingToastId = showLoadingToast("Completando registro con GitHub...");
    set({ loading: true, error: null });
    try {
      const response = await completeGithubRegistrationUseCase.execute(payload);
      if (response.status === "AUTHENTICATED" && response.token) {
        localStorage.setItem("authToken", response.token);
      }
      set({ loading: false });
      showSuccessToast("GitHub registration completed");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`GitHub registration failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
