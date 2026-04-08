import type { login, LoginChallengeResponse } from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class LoginUseCase {
    private loginRepository: ILoginRepository;

    constructor(loginRepository: ILoginRepository) {
        this.loginRepository = loginRepository;
    }

    async execute(credentials: login): Promise<LoginChallengeResponse> {
        return await this.loginRepository.login(credentials);
    }
}