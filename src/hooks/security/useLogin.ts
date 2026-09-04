import { useLoginStore } from "@/store/security/loginStore";
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
} from "@/core/domain/entities/security/Login";

export function useLogin() {
    const {
        loading,
        error,
        challengeToken,
        challengeExpiration,
        clearChallenge,
        register,
        forgotPassword,
        resetPassword,
        login,
        verifyTwoFactor,
        refreshToken,
        getMe,
        loginWithGoogle,
        authorizeGithubLogin,
        loginWithGithub,
        completeGithubRegistration,
    } = useLoginStore();

    return {
        loading,
        error,
        challengeToken,
        challengeExpiration,
        clearChallenge,
        register: (payload: RegisterUser): Promise<RegisterUserResponse> => register(payload),
        forgotPassword: (payload: ForgotPasswordDTO): Promise<MessageResponse> => forgotPassword(payload),
        resetPassword: (payload: ResetPasswordDTO): Promise<MessageResponse> => resetPassword(payload),
        login: (credentials: login): Promise<LoginChallengeResponse> => login(credentials),
        verify2FA: (code: string): Promise<LoginResponse> => verifyTwoFactor(code),
        refreshToken: (options?: {
            expectedRole?: string;
            maxAttempts?: number;
            intervalMs?: number;
        }): Promise<LoginResponse> => refreshToken(options),
        getMe,
        loginWithGoogle: (payload: LoginGoogle): Promise<LoginResponse> => loginWithGoogle(payload),
        authorizeGithubLogin: (): Promise<LoginGithubAuthorizeResponse> => authorizeGithubLogin(),
        loginWithGithub: (payload: LoginGithubCallback): Promise<LoginGithubResponse> =>
            loginWithGithub(payload),
        completeGithubRegistration: (
            payload: LoginGithubCompleteRegistration,
        ): Promise<LoginGithubResponse> => completeGithubRegistration(payload),
    };
}
