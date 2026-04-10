import type { LoginGithubAuthorizeResponse } from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class AuthorizeGithubLoginUseCase {
    private loginRepository: ILoginRepository;

    constructor(loginRepository: ILoginRepository) {
        this.loginRepository = loginRepository;
    }

    async execute(): Promise<LoginGithubAuthorizeResponse> {
        return await this.loginRepository.authorizeGithubLogin();
    }
}
