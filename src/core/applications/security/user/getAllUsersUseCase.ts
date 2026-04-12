import type { User } from "@/core/domain/entities/security/User";
import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";
import type { Page, PageableQuery } from "@/core/types/Page";

export class GetAllUsersUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(pageable: PageableQuery): Promise<Page<User>> {
    return await this.userRepository.getAllUsers(pageable);
  }
}