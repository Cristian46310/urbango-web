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

export interface ILoginRepository {
    login(credentials: login): Promise<LoginChallengeResponse>;
    verifyTwoFactor(payload: Verify2FADTO): Promise<LoginResponse>;
    loginWithGoogle(payload: LoginGoogle): Promise<LoginResponse>;
    authorizeGithubLogin(): Promise<LoginGithubAuthorizeResponse>;
    loginWithGithub(payload: LoginGithubCallback): Promise<LoginGithubResponse>;
    completeGithubRegistration(
        payload: LoginGithubCompleteRegistration,
    ): Promise<LoginGithubResponse>;
}