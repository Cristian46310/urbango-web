import type { CreateUserDTO, UpdateUserDTO, User } from "@/core/domain/entities/security/User";
import type { MessageResponse } from "@/core/types/MessageResponse";

export interface IUserRepository {
  deleteUser(userId: string): Promise<void>;
  putUser(userId: string, userData: UpdateUserDTO): Promise<User>;
  getUser(userId: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  postUser(userData: CreateUserDTO): Promise<User>;
  postUserSession(userId: string, sessionId: string): Promise<MessageResponse>;
  deleteUserSession(userId: string, sessionId: string): Promise<void>;
  postUserProfile(userId: string, profileId: string): Promise<MessageResponse>;
  deleteUserProfile(userId: string, profileId: string): Promise<void>;
}