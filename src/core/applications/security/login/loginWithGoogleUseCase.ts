import type { LoginGoogle, LoginResponse } from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class LoginWithGoogleUseCase {
    private loginRepository: ILoginRepository;

    constructor(loginRepository: ILoginRepository) {
        this.loginRepository = loginRepository;
    }

    async execute(payload: LoginGoogle): Promise<LoginResponse> {
        return await this.loginRepository.loginWithGoogle(payload);
    }
}