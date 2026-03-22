export interface IUserRoleRepository {
  deleteUserRole(userRoleId: string): Promise<void>;
  postUserRole(userId: string, roleId: string): Promise<unknown>;
}