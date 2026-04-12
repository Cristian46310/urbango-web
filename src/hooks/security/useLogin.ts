import { useLoginStore } from "@/store/security/loginStore";
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
    LoginMicrosoftAuthorizeResponse,
    LoginMicrosoftCallback,
    LoginMicrosoftCompleteRegistration,
    LoginMicrosoftResponse,
    LoginGoogle,
    LoginResponse,
    Verify2FADTO,
} from "@/core/domain/entities/security/Login";

export function useLogin() {
    const {
        loading,
        error,
        register,
        forgotPassword,
        resetPassword,
        login,
        verifyTwoFactor,
        loginWithGoogle,
        authorizeGithubLogin,
        loginWithGithub,
        completeGithubRegistration,
        authorizeMicrosoftLogin,
        loginWithMicrosoft,
        completeMicrosoftRegistration,
    } = useLoginStore();

    return {
        loading,
        error,
        register: (payload: RegisterUser): Promise<RegisterUserResponse> => register(payload),
        forgotPassword: (payload: ForgotPasswordDTO): Promise<MessageResponse> => forgotPassword(payload),
        resetPassword: (payload: ResetPasswordDTO): Promise<MessageResponse> => resetPassword(payload),
        login: (credentials: login): Promise<LoginChallengeResponse> => login(credentials),
        verify2FA: (payload: Verify2FADTO): Promise<LoginResponse> => verifyTwoFactor(payload),
        loginWithGoogle: (payload: LoginGoogle): Promise<LoginResponse> => loginWithGoogle(payload),
        authorizeGithubLogin: (): Promise<LoginGithubAuthorizeResponse> => authorizeGithubLogin(),
        loginWithGithub: (payload: LoginGithubCallback): Promise<LoginGithubResponse> =>
            loginWithGithub(payload),
        completeGithubRegistration: (
            payload: LoginGithubCompleteRegistration,
        ): Promise<LoginGithubResponse> => completeGithubRegistration(payload),
        authorizeMicrosoftLogin: (): Promise<LoginMicrosoftAuthorizeResponse> => authorizeMicrosoftLogin(),
        loginWithMicrosoft: (payload: LoginMicrosoftCallback): Promise<LoginMicrosoftResponse> =>
            loginWithMicrosoft(payload),
        completeMicrosoftRegistration: (
            payload: LoginMicrosoftCompleteRegistration,
        ): Promise<LoginMicrosoftResponse> => completeMicrosoftRegistration(payload),
    };
}