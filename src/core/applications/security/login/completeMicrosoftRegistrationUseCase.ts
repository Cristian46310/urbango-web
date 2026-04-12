import type {
    LoginMicrosoftCompleteRegistration,
    LoginMicrosoftResponse,
} from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class CompleteMicrosoftRegistrationUseCase {
    private loginRepository: ILoginRepository;

    constructor(loginRepository: ILoginRepository) {
        this.loginRepository = loginRepository;
    }

    async execute(payload: LoginMicrosoftCompleteRegistration): Promise<LoginMicrosoftResponse> {
        if (!payload.registrationToken) {
            throw new Error("Registration token is required");
        }
        if (!payload.email) {
            throw new Error("Email is required");
        }

        return await this.loginRepository.completeMicrosoftRegistration(payload);
    }
}
