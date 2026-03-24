import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { login, LoginResponse } from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class LoginRepository implements ILoginRepository {
    async login(credentials: login): Promise<LoginResponse> {
        return await httpMsSecurity.post<LoginResponse>(ENDPOINTS.SECURITY.LOGIN, credentials);
    }
}