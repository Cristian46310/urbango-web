import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
    login,
    LoginChallengeResponse,
    LoginResponse,
    Verify2FADTO,
} from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class LoginRepository implements ILoginRepository {
    async login(credentials: login): Promise<LoginChallengeResponse> {
        return await httpMsSecurity.post<LoginChallengeResponse>(ENDPOINTS.SECURITY.LOGIN, credentials);
    }

    async verifyTwoFactor(payload: Verify2FADTO): Promise<LoginResponse> {
        return await httpMsSecurity.post<LoginResponse>(ENDPOINTS.SECURITY.VERIFY_2FA, payload);
    }
}