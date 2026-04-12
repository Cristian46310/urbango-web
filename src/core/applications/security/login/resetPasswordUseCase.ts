import type {
  MessageResponse,
  ResetPasswordDTO,
} from "@/core/domain/entities/security/Login";
import type { ILoginRepository } from "@/core/domain/interfaces/security/ILoginRepository";

export class ResetPasswordUseCase {
  private loginRepository: ILoginRepository;

  constructor(loginRepository: ILoginRepository) {
    this.loginRepository = loginRepository;
  }

  async execute(payload: ResetPasswordDTO): Promise<MessageResponse> {
    return await this.loginRepository.resetPassword(payload);
  }
}
