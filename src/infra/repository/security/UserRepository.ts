import { httpMsSecurity } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { CreateUserDTO, UpdateUserDTO, User } from "@/core/domain/entities/security/User";
import type { IUserRepository } from "@/core/domain/interfaces/security/IUserRepository";
import type { MessageResponse } from "@/core/types/MessageResponse";
import type { Page, PageableQuery } from "@/core/types/Page";

export class UserRepository implements IUserRepository {
  async deleteUser(userId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(ENDPOINTS.USER.BY_ID(userId));
  }

  async putUser(userId: string, userData: UpdateUserDTO): Promise<User> {
    return await httpMsSecurity.put<User>(ENDPOINTS.USER.BY_ID(userId), userData);
  }

  async getUser(userId: string): Promise<User> {
    return await httpMsSecurity.get<User>(ENDPOINTS.USER.BY_ID(userId));
  }

  async getAllUsers(pageable: PageableQuery): Promise<Page<User>> {
    return await httpMsSecurity.get<Page<User>>(ENDPOINTS.USER.BASE, {
      params: pageable,
    });
  }

  async postUser(userData: CreateUserDTO): Promise<User> {
    return await httpMsSecurity.post<User>(ENDPOINTS.USER.BASE, userData);
  }

  async postUserSession(userId: string, sessionId: string): Promise<MessageResponse> {
    return await httpMsSecurity.post<MessageResponse>(ENDPOINTS.USER.SESSION.BASE(userId, sessionId));
  }

  async deleteUserSession(userId: string, sessionId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(ENDPOINTS.USER.SESSION.BASE(userId, sessionId));
  }

  async postUserProfile(userId: string, profileId: string): Promise<MessageResponse> {
    return await httpMsSecurity.post<MessageResponse>(ENDPOINTS.USER.PROFILE.BASE(userId, profileId));
  }

  async deleteUserProfile(userId: string, profileId: string): Promise<void> {
    await httpMsSecurity.delete<Record<string, never>>(ENDPOINTS.USER.PROFILE.BASE(userId, profileId));
  }
}

export const userRepository = new UserRepository();