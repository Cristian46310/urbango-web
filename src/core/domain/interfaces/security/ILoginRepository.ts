import type {
    login,
    RegisterUser,
    RegisterUserResponse,
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

export interface ILoginRepository {
    register(payload: RegisterUser): Promise<RegisterUserResponse>;
    login(credentials: login): Promise<LoginChallengeResponse>;
    verifyTwoFactor(payload: Verify2FADTO): Promise<LoginResponse>;
    loginWithGoogle(payload: LoginGoogle): Promise<LoginResponse>;
    authorizeGithubLogin(): Promise<LoginGithubAuthorizeResponse>;
    loginWithGithub(payload: LoginGithubCallback): Promise<LoginGithubResponse>;
    completeGithubRegistration(
        payload: LoginGithubCompleteRegistration,
    ): Promise<LoginGithubResponse>;
    authorizeMicrosoftLogin(): Promise<LoginMicrosoftAuthorizeResponse>;
    loginWithMicrosoft(payload: LoginMicrosoftCallback): Promise<LoginMicrosoftResponse>;
    completeMicrosoftRegistration(
        payload: LoginMicrosoftCompleteRegistration,
    ): Promise<LoginMicrosoftResponse>;
}