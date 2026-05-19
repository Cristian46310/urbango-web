import type { User } from "@/core/domain/entities/security/User";

export interface login {
    email: string;
    password: string;
    recaptchaToken: string;
}

export interface RegisterUser {
    name: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterUserResponse {
    message: string;
}

export interface ForgotPasswordDTO {
    email: string;
    recaptchaToken: string;
}

export interface ResetPasswordDTO {
    token: string;
    newPassword: string;
}

export interface MessageResponse {
    message: string;
}

export interface Verify2FADTO {
    challengeToken: string;
    code: string;
}

export interface LoginChallengeResponse {
    challengeToken: string;
    expiration: string;
    message: string;
}

export interface LoginResponse {
    token: string;
}

export interface LoginGoogle {
    idToken: string;
}

export interface LoginGithubAuthorizeResponse {
    authorizationUrl: string;
}

export interface LoginMicrosoftAuthorizeResponse {
    authorizationUrl: string;
}

export interface LoginGithubCallback {
    code: string;
    state: string;
}

export interface LoginMicrosoftCallback {
    code: string;
    state: string;
}

export interface LoginGithubCompleteRegistration {
    registrationToken: string;
    email: string;
}

export interface LoginMicrosoftCompleteRegistration {
    registrationToken: string;
    email: string;
}

export interface LoginGithubResponse {
    status: string;
    message: string;
    token: string | null;
    idToken: string | null;
    registrationToken: string | null;
    linked: boolean;
    created: boolean;
    user: User | null;
}

export interface LoginMicrosoftResponse {
    status: string;
    message: string;
    token: string | null;
    idToken: string | null;
    registrationToken: string | null;
    linked: boolean;
    created: boolean;
    user: User | null;
}
