import { useLoginStore } from "@/store/security/loginStore";
import type {
    login,
    LoginChallengeResponse,
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
    } = useLoginStore();

    return {
        loading,
        error,
        login: (credentials: login): Promise<LoginChallengeResponse> => login(credentials),
        verify2FA: (payload: Verify2FADTO): Promise<LoginResponse> => verifyTwoFactor(payload),
        loginWithGoogle: (payload: LoginGoogle): Promise<LoginResponse> => loginWithGoogle(payload),
    };
}