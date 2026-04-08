import type { LoginResponse, Verify2FADTO } from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class VerifyTwoFactorUseCase {
  private loginRepository: ILoginRepository;

  constructor(loginRepository: ILoginRepository) {
    this.loginRepository = loginRepository;
  }

  async execute(payload: Verify2FADTO): Promise<LoginResponse> {
    if (!payload.challengeToken) {
      throw new Error("Challenge token is required");
    }
    if (!payload.code) {
      throw new Error("2FA code is required");
    }

    return await this.loginRepository.verifyTwoFactor(payload);
  }
}
