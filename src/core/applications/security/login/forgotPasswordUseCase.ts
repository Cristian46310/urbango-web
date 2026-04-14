import type {
  ForgotPasswordDTO,
  MessageResponse,
} from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class ForgotPasswordUseCase {
  private loginRepository: ILoginRepository;

  constructor(loginRepository: ILoginRepository) {
    this.loginRepository = loginRepository;
  }

  async execute(payload: ForgotPasswordDTO): Promise<MessageResponse> {
    return await this.loginRepository.forgotPassword(payload);
  }
}
