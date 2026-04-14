import type {
    LoginGithubCallback,
    LoginGithubResponse,
} from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class LoginWithGithubUseCase {
    private loginRepository: ILoginRepository;

    constructor(loginRepository: ILoginRepository) {
        this.loginRepository = loginRepository;
    }

    async execute(payload: LoginGithubCallback): Promise<LoginGithubResponse> {
        if (!payload.code) {
            throw new Error("GitHub code is required");
        }
        if (!payload.state) {
            throw new Error("GitHub state is required");
        }

        return await this.loginRepository.loginWithGithub(payload);
    }
}
