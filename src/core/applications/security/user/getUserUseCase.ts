import type { User } from "@/core/domain/entities/security/User";
import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";

export class GetUserUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string): Promise<User> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    return await this.userRepository.getUser(userId);
  }
}