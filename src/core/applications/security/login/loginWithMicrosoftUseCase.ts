import type {
    LoginMicrosoftCallback,
    LoginMicrosoftResponse,
} from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class LoginWithMicrosoftUseCase {
    private loginRepository: ILoginRepository;

    constructor(loginRepository: ILoginRepository) {
        this.loginRepository = loginRepository;
    }

    async execute(payload: LoginMicrosoftCallback): Promise<LoginMicrosoftResponse> {
        if (!payload.code) {
            throw new Error("Microsoft code is required");
        }
        if (!payload.state) {
            throw new Error("Microsoft state is required");
        }

        return await this.loginRepository.loginWithMicrosoft(payload);
    }
}
