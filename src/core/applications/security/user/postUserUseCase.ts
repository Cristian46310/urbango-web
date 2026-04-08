import type { CreateUserDTO, User } from "@/core/domain/entities/security/User";
import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";

export class PostUserUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userData: CreateUserDTO): Promise<User> {
    return await this.userRepository.postUser(userData);
  }
}