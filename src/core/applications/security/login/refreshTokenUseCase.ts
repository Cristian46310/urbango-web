import type { LoginResponse } from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class RefreshTokenUseCase {
  private loginRepository: ILoginRepository;

  constructor(loginRepository: ILoginRepository) {
    this.loginRepository = loginRepository;
  }

  async execute(): Promise<LoginResponse> {
    return await this.loginRepository.refreshToken();
  }
}
