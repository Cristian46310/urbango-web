import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
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
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class LoginRepository implements ILoginRepository {
    async register(payload: RegisterUser): Promise<RegisterUserResponse> {
        return httpMsSecurity.post<RegisterUserResponse>(ENDPOINTS.SECURITY.REGISTER, payload);
    }

    async forgotPassword(payload: ForgotPasswordDTO): Promise<MessageResponse> {
        return httpMsSecurity.post<MessageResponse>(ENDPOINTS.SECURITY.FORGOT_PASSWORD, payload);
    }

    async resetPassword(payload: ResetPasswordDTO): Promise<MessageResponse> {
        return httpMsSecurity.post<MessageResponse>(ENDPOINTS.SECURITY.RESET_PASSWORD, payload);
    }

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
        // Contract: exact camelCase body keys only
        const body: Verify2FADTO = {
            challengeToken: payload.challengeToken,
            code: payload.code,
        };
        return await httpMsSecurity.post<LoginResponse>(ENDPOINTS.SECURITY.VERIFY_2FA, body);
    }

    async refreshToken(): Promise<LoginResponse> {
        return await httpMsSecurity.post<LoginResponse>(ENDPOINTS.SECURITY.REFRESH_TOKEN);
    }

    async getMe(): Promise<SecurityMe> {
        return await httpMsSecurity.get<SecurityMe>(ENDPOINTS.SECURITY.ME);
    }
}
