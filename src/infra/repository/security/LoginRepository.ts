import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
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
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class LoginRepository implements ILoginRepository {
    async authorizeGithubLogin(): Promise<LoginGithubAuthorizeResponse> {
        return httpMsSecurity.post<LoginGithubAuthorizeResponse>(
            ENDPOINTS.SECURITY.LOGIN_GITHUB_AUTHORIZE,
        );
    }

    async loginWithGithub(payload: LoginGithubCallback): Promise<LoginGithubResponse> {
        return httpMsSecurity.post<LoginGithubResponse>(ENDPOINTS.SECURITY.LOGIN_GITHUB, payload);
    }

    async completeGithubRegistration(
        payload: LoginGithubCompleteRegistration,
    ): Promise<LoginGithubResponse> {
        return httpMsSecurity.post<LoginGithubResponse>(
            ENDPOINTS.SECURITY.LOGIN_GITHUB_COMPLETE,
            payload,
        );
    }

    async loginWithGoogle(payload: LoginGoogle): Promise<LoginResponse> {
        return httpMsSecurity.post<LoginResponse>(ENDPOINTS.SECURITY.LOGIN_GOOGLE, payload);
    }
    async login(credentials: login): Promise<LoginChallengeResponse> {
        return await httpMsSecurity.post<LoginChallengeResponse>(ENDPOINTS.SECURITY.LOGIN, credentials);
    }

    async verifyTwoFactor(payload: Verify2FADTO): Promise<LoginResponse> {
        return await httpMsSecurity.post<LoginResponse>(ENDPOINTS.SECURITY.VERIFY_2FA, payload);
    }
}