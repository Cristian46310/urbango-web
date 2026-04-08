import type {
    login,
    LoginChallengeResponse,
    LoginResponse,
    Verify2FADTO,
} from "@/core/domain/entities/security/Login";

export interface ILoginRepository {
    login(credentials: login): Promise<LoginChallengeResponse>;
    verifyTwoFactor(payload: Verify2FADTO): Promise<LoginResponse>;
}