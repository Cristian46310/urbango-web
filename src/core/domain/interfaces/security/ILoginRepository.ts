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

export interface ILoginRepository {
    register(payload: RegisterUser): Promise<RegisterUserResponse>;
    forgotPassword(payload: ForgotPasswordDTO): Promise<MessageResponse>;
    resetPassword(payload: ResetPasswordDTO): Promise<MessageResponse>;
    login(credentials: login): Promise<LoginChallengeResponse>;
    verifyTwoFactor(payload: Verify2FADTO): Promise<LoginResponse>;
    refreshToken(): Promise<LoginResponse>;
    getMe(): Promise<SecurityMe>;
    loginWithGoogle(payload: LoginGoogle): Promise<LoginResponse>;
    authorizeGithubLogin(): Promise<LoginGithubAuthorizeResponse>;
    loginWithGithub(payload: LoginGithubCallback): Promise<LoginGithubResponse>;
    completeGithubRegistration(
        payload: LoginGithubCompleteRegistration,
    ): Promise<LoginGithubResponse>;
}
