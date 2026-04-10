import type {
    login,
    LoginChallengeResponse,
    LoginGoogle,
    LoginResponse,
    Verify2FADTO,
} from "@/core/domain/entities/security/Login";

export interface ILoginRepository {
    login(credentials: login): Promise<LoginChallengeResponse>;
    verifyTwoFactor(payload: Verify2FADTO): Promise<LoginResponse>;
    loginWithGoogle(payload: LoginGoogle): Promise<LoginResponse>;
}