import type { UpdateUserDTO, User } from "@/core/domain/entities/security/User";
import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";

export class PutUserUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string, userData: UpdateUserDTO): Promise<User> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    return await this.userRepository.putUser(userId, userData);
  }
}