import type { login, LoginResponse } from "@/core/domain/entities/security/Login";

export interface ILoginRepository {
    login(credentials: login): Promise<LoginResponse>;
}