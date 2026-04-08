export interface login {
    email: string;
    password: string;
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