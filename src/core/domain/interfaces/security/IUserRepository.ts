import type { User } from "@/core/domain/entities/security/User";

export interface IUserRepository {
  deleteUser(userId: string): Promise<void>;
  putUser(userId: string, userData: User): Promise<User>;
  getUser(userId: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  postUser(userData: User): Promise<User>;
  postUserSession(userId: string, sessionId: string): Promise<unknown>;
  deleteUserSession(userId: string, sessionId: string): Promise<void>;
  postUserProfile(userId: string, profileId: string): Promise<unknown>;
  deleteUserProfile(userId: string, profileId: string): Promise<void>;
}