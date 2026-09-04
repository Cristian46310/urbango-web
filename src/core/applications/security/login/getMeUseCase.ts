import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";
import type { SecurityMe } from "@/core/domain/entities/security/Login";

export class GetMeUseCase {
  private readonly loginRepository: ILoginRepository;

  constructor(loginRepository: ILoginRepository) {
    this.loginRepository = loginRepository;
  }

  async execute(): Promise<SecurityMe> {
    return this.loginRepository.getMe();
  }
}
