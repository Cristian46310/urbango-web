import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";

export class DeleteUserUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    await this.userRepository.deleteUser(userId);
  }
}