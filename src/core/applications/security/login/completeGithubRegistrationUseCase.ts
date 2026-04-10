import type {
    LoginGithubCompleteRegistration,
    LoginGithubResponse,
} from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class CompleteGithubRegistrationUseCase {
    private loginRepository: ILoginRepository;

    constructor(loginRepository: ILoginRepository) {
        this.loginRepository = loginRepository;
    }

    async execute(payload: LoginGithubCompleteRegistration): Promise<LoginGithubResponse> {
        if (!payload.registrationToken) {
            throw new Error("Registration token is required");
        }
        if (!payload.email) {
            throw new Error("Email is required");
        }

        return await this.loginRepository.completeGithubRegistration(payload);
    }
}
