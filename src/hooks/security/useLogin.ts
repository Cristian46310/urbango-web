import { useLoginStore } from "@/store/security/loginStore";
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

export function useLogin() {
    const {
        loading,
        error,
        login,
        verifyTwoFactor,
        loginWithGoogle,
        authorizeGithubLogin,
        loginWithGithub,
        completeGithubRegistration,
    } = useLoginStore();

    return {
        loading,
        error,
        login: (credentials: login): Promise<LoginChallengeResponse> => login(credentials),
        verify2FA: (payload: Verify2FADTO): Promise<LoginResponse> => verifyTwoFactor(payload),
        loginWithGoogle: (payload: LoginGoogle): Promise<LoginResponse> => loginWithGoogle(payload),
        authorizeGithubLogin: (): Promise<LoginGithubAuthorizeResponse> => authorizeGithubLogin(),
        loginWithGithub: (payload: LoginGithubCallback): Promise<LoginGithubResponse> =>
            loginWithGithub(payload),
        completeGithubRegistration: (
            payload: LoginGithubCompleteRegistration,
        ): Promise<LoginGithubResponse> => completeGithubRegistration(payload),
    };
}