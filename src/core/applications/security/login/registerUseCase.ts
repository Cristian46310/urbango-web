import type {
  RegisterUser,
  RegisterUserResponse,
} from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class RegisterUseCase {
  private loginRepository: ILoginRepository;

  constructor(loginRepository: ILoginRepository) {
    this.loginRepository = loginRepository;
  }

  async execute(payload: RegisterUser): Promise<RegisterUserResponse> {
    return await this.loginRepository.register(payload);
  }
}
