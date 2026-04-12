import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import { LoginRepository } from "@/infra/repository/security/LoginRepository";
import { AuthorizeGithubLoginUseCase } from "@/core/applications/security/login/authorizeGithubLoginUseCase";
import { AuthorizeMicrosoftLoginUseCase } from "@/core/applications/security/login/authorizeMicrosoftLoginUseCase";
import { CompleteGithubRegistrationUseCase } from "@/core/applications/security/login/completeGithubRegistrationUseCase";
import { CompleteMicrosoftRegistrationUseCase } from "@/core/applications/security/login/completeMicrosoftRegistrationUseCase";
import { LoginUseCase } from "@/core/applications/security/login/loginUseCase";
import { LoginWithGithubUseCase } from "@/core/applications/security/login/loginWithGithubUseCase";
import { LoginWithMicrosoftUseCase } from "@/core/applications/security/login/loginWithMicrosoftUseCase";
import { LoginWithGoogleUseCase } from "@/core/applications/security/login/loginWithGoogleUseCase";
import { RegisterUseCase } from "@/core/applications/security/login/registerUseCase";
import { VerifyTwoFactorUseCase } from "@/core/applications/security/login/verifyTwoFactorUseCase";
import type {
  login,
  RegisterUser,
  RegisterUserResponse,
  LoginChallengeResponse,
  LoginGithubAuthorizeResponse,
  LoginGithubCallback,
  LoginGithubCompleteRegistration,
  LoginGithubResponse,
  LoginMicrosoftAuthorizeResponse,
  LoginMicrosoftCallback,
  LoginMicrosoftCompleteRegistration,
  LoginMicrosoftResponse,
  LoginGoogle,
  LoginResponse,
  Verify2FADTO,
} from "@/core/domain/entities/security/Login";

const loginRepository = new LoginRepository();
const authorizeGithubLoginUseCase = new AuthorizeGithubLoginUseCase(loginRepository);
const authorizeMicrosoftLoginUseCase = new AuthorizeMicrosoftLoginUseCase(loginRepository);
const completeGithubRegistrationUseCase = new CompleteGithubRegistrationUseCase(loginRepository);
const completeMicrosoftRegistrationUseCase = new CompleteMicrosoftRegistrationUseCase(loginRepository);
const loginUseCase = new LoginUseCase(loginRepository);
const loginWithGithubUseCase = new LoginWithGithubUseCase(loginRepository);
const loginWithMicrosoftUseCase = new LoginWithMicrosoftUseCase(loginRepository);
const loginWithGoogleUseCase = new LoginWithGoogleUseCase(loginRepository);
const registerUseCase = new RegisterUseCase(loginRepository);
const verifyTwoFactorUseCase = new VerifyTwoFactorUseCase(loginRepository);

interface LoginStoreState {
  loading: boolean;
  error: string | null;
  register: (payload: RegisterUser) => Promise<RegisterUserResponse>;
  login: (credentials: login) => Promise<LoginChallengeResponse>;
  verifyTwoFactor: (payload: Verify2FADTO) => Promise<LoginResponse>;
  loginWithGoogle: (payload: LoginGoogle) => Promise<LoginResponse>;
  authorizeGithubLogin: () => Promise<LoginGithubAuthorizeResponse>;
  loginWithGithub: (payload: LoginGithubCallback) => Promise<LoginGithubResponse>;
  completeGithubRegistration: (
    payload: LoginGithubCompleteRegistration,
  ) => Promise<LoginGithubResponse>;
  authorizeMicrosoftLogin: () => Promise<LoginMicrosoftAuthorizeResponse>;
  loginWithMicrosoft: (payload: LoginMicrosoftCallback) => Promise<LoginMicrosoftResponse>;
  completeMicrosoftRegistration: (
    payload: LoginMicrosoftCompleteRegistration,
  ) => Promise<LoginMicrosoftResponse>;
}

export const useLoginStore = create<LoginStoreState>((set) => ({
  loading: false,
  error: null,
  register: async (payload: RegisterUser) => {
    const loadingToastId = showLoadingToast("Creando cuenta...");
    set({ loading: true, error: null });
    try {
      const response = await registerUseCase.execute(payload);
      set({ loading: false });
      showSuccessToast("Cuenta creada exitosamente");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Registro fallido: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
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
  authorizeMicrosoftLogin: async () => {
    const loadingToastId = showLoadingToast("Autorizando Microsoft...");
    set({ loading: true, error: null });
    try {
      const response = await authorizeMicrosoftLoginUseCase.execute();
      set({ loading: false });
      showSuccessToast("Microsoft authorization successful");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Microsoft authorize failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  loginWithMicrosoft: async (payload: LoginMicrosoftCallback) => {
    const loadingToastId = showLoadingToast("Iniciando sesion con Microsoft...");
    set({ loading: true, error: null });
    try {
      const response = await loginWithMicrosoftUseCase.execute(payload);
      if (response.status === "AUTHENTICATED" && response.token) {
        localStorage.setItem("authToken", response.token);
      }
      set({ loading: false });
      showSuccessToast("Microsoft login successful");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Microsoft login failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  completeMicrosoftRegistration: async (payload: LoginMicrosoftCompleteRegistration) => {
    const loadingToastId = showLoadingToast("Completando registro con Microsoft...");
    set({ loading: true, error: null });
    try {
      const response = await completeMicrosoftRegistrationUseCase.execute(payload);
      if (response.status === "AUTHENTICATED" && response.token) {
        localStorage.setItem("authToken", response.token);
      }
      set({ loading: false });
      showSuccessToast("Microsoft registration completed");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Microsoft registration failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
