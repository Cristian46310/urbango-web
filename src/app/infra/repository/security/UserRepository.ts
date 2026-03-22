import { httpMsSecurity } from "@/app/infra/api/builderHttp";
import { ENDPOINTS } from "@/app/infra/api/endpoints";
import type { User } from "@/core/domain/entities/security/User";
import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";

export class UserRepository implements IUserRepository {
  async deleteUser(userId: string): Promise<void> {
    await httpMsSecurity.delete<void>(ENDPOINTS.USER.BY_ID(userId));
  }

  async putUser(userId: string, userData: User): Promise<User> {
    return await httpMsSecurity.put<User>(ENDPOINTS.USER.BY_ID(userId), userData);
  }

  async getUser(userId: string): Promise<User> {
    return await httpMsSecurity.get<User>(ENDPOINTS.USER.BY_ID(userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await httpMsSecurity.get<User[]>(ENDPOINTS.USER.BASE);
  }

  async postUser(userData: User): Promise<User> {
    return await httpMsSecurity.post<User>(ENDPOINTS.USER.BASE, userData);
  }

  async postUserSession(userId: string, sessionId: string): Promise<unknown> {
    return await httpMsSecurity.post<unknown>(ENDPOINTS.USER.SESSION.BASE(userId, sessionId));
  }

  async deleteUserSession(userId: string, sessionId: string): Promise<void> {
    await httpMsSecurity.delete<void>(ENDPOINTS.USER.SESSION.BASE(userId, sessionId));
  }

  async postUserProfile(userId: string, profileId: string): Promise<unknown> {
    return await httpMsSecurity.post<unknown>(ENDPOINTS.USER.PROFILE.BASE(userId, profileId));
  }

  async deleteUserProfile(userId: string, profileId: string): Promise<void> {
    await httpMsSecurity.delete<void>(ENDPOINTS.USER.PROFILE.BASE(userId, profileId));
  }
}

export const userRepository = new UserRepository();