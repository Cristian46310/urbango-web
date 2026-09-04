import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { LoginRepository } from "@/infra/repository/security/LoginRepository";
import { useAuthStore } from "@/store/security/authStore";
import { AuthorizeGithubLoginUseCase } from "@/core/applications/security/login/authorizeGithubLoginUseCase";
import { CompleteGithubRegistrationUseCase } from "@/core/applications/security/login/completeGithubRegistrationUseCase";
import { LoginUseCase } from "@/core/applications/security/login/loginUseCase";
import { LoginWithGithubUseCase } from "@/core/applications/security/login/loginWithGithubUseCase";
import { LoginWithGoogleUseCase } from "@/core/applications/security/login/loginWithGoogleUseCase";
import { RegisterUseCase } from "@/core/applications/security/login/registerUseCase";
import { ForgotPasswordUseCase } from "@/core/applications/security/login/forgotPasswordUseCase";
import { ResetPasswordUseCase } from "@/core/applications/security/login/resetPasswordUseCase";
import { RefreshTokenUseCase } from "@/core/applications/security/login/refreshTokenUseCase";
import { GetMeUseCase } from "@/core/applications/security/login/getMeUseCase";
import { VerifyTwoFactorUseCase } from "@/core/applications/security/login/verifyTwoFactorUseCase";
import type {
  login,
  RegisterUser,
  RegisterUserResponse,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  MessageResponse,
  LoginChallengeResponse,
  LoginGithubAuthorizeResponse,
  LoginGithubCallback,
  LoginGithubCompleteRegistration,
  LoginGithubResponse,
  LoginGoogle,
  LoginResponse,
  SecurityMe,
  Verify2FADTO,
} from "@/core/domain/entities/security/Login";

const loginRepository = new LoginRepository();
const authorizeGithubLoginUseCase = new AuthorizeGithubLoginUseCase(loginRepository);
const completeGithubRegistrationUseCase = new CompleteGithubRegistrationUseCase(loginRepository);
const loginUseCase = new LoginUseCase(loginRepository);
const loginWithGithubUseCase = new LoginWithGithubUseCase(loginRepository);
const loginWithGoogleUseCase = new LoginWithGoogleUseCase(loginRepository);
const registerUseCase = new RegisterUseCase(loginRepository);
const forgotPasswordUseCase = new ForgotPasswordUseCase(loginRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(loginRepository);
const verifyTwoFactorUseCase = new VerifyTwoFactorUseCase(loginRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(loginRepository);
const getMeUseCase = new GetMeUseCase(loginRepository);

interface LoginStoreState {
  loading: boolean;
  error: string | null;
  challengeToken: string | null;
  challengeExpiration: string | null;
  clearChallenge: () => void;
  register: (payload: RegisterUser) => Promise<RegisterUserResponse>;
  forgotPassword: (payload: ForgotPasswordDTO) => Promise<MessageResponse>;
  resetPassword: (payload: ResetPasswordDTO) => Promise<MessageResponse>;
  login: (credentials: login) => Promise<LoginChallengeResponse>;
  verifyTwoFactor: (code: string) => Promise<LoginResponse>;
  refreshToken: (options?: {
    expectedRole?: string;
    maxAttempts?: number;
    intervalMs?: number;
  }) => Promise<LoginResponse>;
  getMe: () => Promise<SecurityMe>;
  loginWithGoogle: (payload: LoginGoogle) => Promise<LoginResponse>;
  authorizeGithubLogin: () => Promise<LoginGithubAuthorizeResponse>;
  loginWithGithub: (payload: LoginGithubCallback) => Promise<LoginGithubResponse>;
  completeGithubRegistration: (
    payload: LoginGithubCompleteRegistration,
  ) => Promise<LoginGithubResponse>;
}

export const useLoginStore = create<LoginStoreState>((set, get) => ({
  loading: false,
  error: null,
  challengeToken: null,
  challengeExpiration: null,
  clearChallenge: () => {
    set({ challengeToken: null, challengeExpiration: null, error: null });
  },
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
  forgotPassword: async (payload: ForgotPasswordDTO) => {
    const loadingToastId = showLoadingToast("Enviando solicitud de recuperacion...");
    set({ loading: true, error: null });
    try {
      if (!payload.email) {
        set({ loading: false, error: "Email is required" });
        showErrorToast("Email is required");
        throw new Error("Email is required");
      }

      const response = await forgotPasswordUseCase.execute(payload);
      set({ loading: false });
      showSuccessToast("Solicitud enviada correctamente");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Password recovery failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  resetPassword: async (payload: ResetPasswordDTO) => {
    const loadingToastId = showLoadingToast("Actualizando contrasena...");
    set({ loading: true, error: null });
    try {
      if (!payload.token || !payload.newPassword) {
        set({ loading: false, error: "Token and new password are required" });
        showErrorToast("Token and new password are required");
        throw new Error("Token and new password are required");
      }

      const response = await resetPasswordUseCase.execute(payload);
      set({ loading: false });
      showSuccessToast("Contrasena actualizada");
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Reset password failed: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  login: async (credentials: login) => {
    const loadingToastId = showLoadingToast("Iniciando sesion...");
    set({ loading: true, error: null, challengeToken: null, challengeExpiration: null });
    try {
      if (!credentials.email || !credentials.password) {
        set({ loading: false, error: "Email and password are required" });
        showErrorToast("Email and password are required");
        throw new Error("Email and password are required");
      }
      const response = await loginUseCase.execute(credentials);
      if (!response.challengeToken) {
        const message = "Login response missing challengeToken";
        set({ loading: false, error: message });
        showErrorToast(message);
        throw new Error(message);
      }
      set({
        loading: false,
        challengeToken: response.challengeToken,
        challengeExpiration: response.expiration ?? null,
      });
      return response;
    } catch (error) {
      const message = getApiErrorMessage(error, "No se pudo iniciar sesión");
      set({ loading: false, error: message, challengeToken: null, challengeExpiration: null });
      showErrorToast(message);
      throw new Error(message);
    } finally {
      dismissToast(loadingToastId);
    }
  },
  verifyTwoFactor: async (code: string) => {
    const loadingToastId = showLoadingToast("Validando codigo 2FA...");
    set({ loading: true, error: null });
    try {
      const challengeToken = get().challengeToken?.trim() ?? "";
      const normalizedCode = code.trim();

      if (!challengeToken || !normalizedCode) {
        set({ loading: false, error: "Challenge token and 2FA code are required" });
        showErrorToast("Challenge token and 2FA code are required");
        throw new Error("Challenge token and 2FA code are required");
      }

      const payload: Verify2FADTO = {
        challengeToken,
        code: normalizedCode,
      };

      const response = await verifyTwoFactorUseCase.execute(payload);
      useAuthStore.getState().setToken(response.token);
      set({ loading: false, challengeToken: null, challengeExpiration: null });
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
  refreshToken: async (options) => {
    const maxAttempts = options?.maxAttempts ?? 6;
    const intervalMs = options?.intervalMs ?? 5000;
    const expectedRole = options?.expectedRole?.toUpperCase();

    set({ loading: true, error: null });
    let lastError: Error | null = null;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const response = await refreshTokenUseCase.execute();
          useAuthStore.getState().setToken(response.token);

          if (!expectedRole) {
            set({ loading: false });
            return response;
          }

          const roles = useAuthStore.getState().currentUser?.roles ?? [];
          if (roles.some((role) => role.toUpperCase() === expectedRole)) {
            set({ loading: false });
            return response;
          }

          if (attempt < maxAttempts) {
            await new Promise((resolve) => {
              setTimeout(resolve, intervalMs);
            });
          } else {
            set({ loading: false });
            return response;
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(getApiErrorMessage(error));
          if (attempt < maxAttempts) {
            await new Promise((resolve) => {
              setTimeout(resolve, intervalMs);
            });
            continue;
          }
          throw lastError;
        }
      }

      throw lastError ?? new Error("No se pudo actualizar el token");
    } catch (error) {
      const message = getApiErrorMessage(error, "No se pudo actualizar permisos");
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
  getMe: async () => {
    set({ loading: true, error: null });
    try {
      const me = await getMeUseCase.execute();
      set({ loading: false });
      return me;
    } catch (error) {
      const message = getApiErrorMessage(error, "No se pudo cargar el perfil de seguridad");
      set({ loading: false, error: message });
      throw new Error(message);
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
      useAuthStore.getState().setToken(response.token);
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
        useAuthStore.getState().setToken(response.token);
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
        useAuthStore.getState().setToken(response.token);
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
