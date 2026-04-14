import type { LoginMicrosoftAuthorizeResponse } from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class AuthorizeMicrosoftLoginUseCase {
    private loginRepository: ILoginRepository;

    constructor(loginRepository: ILoginRepository) {
        this.loginRepository = loginRepository;
    }

    async execute(): Promise<LoginMicrosoftAuthorizeResponse> {
        return await this.loginRepository.authorizeMicrosoftLogin();
    }
}
