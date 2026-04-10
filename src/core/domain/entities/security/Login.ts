export interface login {
    email: string;
    password: string;
    recaptchaToken: string;
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

export interface LoginGithubCallback {
    code: string;
    state: string;
}

export interface LoginGithubCompleteRegistration {
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
    user: unknown | null;
}