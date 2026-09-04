import { useUserStore } from "@/store";
import type { CreateUserDTO, UpdateUserDTO } from "@/core/domain/entities/security/User";
import type { PageableQuery } from "@/core/types/Page";

export function useUser() {
  const {
    users,
    usersPage,
    loading,
    error,
    fetchUser,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser,
    assignSessionToUser,
    removeSessionFromUser,
  } = useUserStore();

  return {
    users,
    usersPage,
    loading,
    error,
    loadUsers: (pageable?: PageableQuery) => fetchAllUsers(pageable),
    getUserById: (userId: string) => fetchUser(userId),
    addUser: (userData: CreateUserDTO) => createUser(userData),
    editUser: (userId: string, userData: UpdateUserDTO) => updateUser(userId, userData),
    removeUser: (userId: string) => deleteUser(userId),
    assignSession: (userId: string, sessionId: string) => assignSessionToUser(userId, sessionId),
    unassignSession: (userId: string, sessionId: string) => removeSessionFromUser(userId, sessionId),
  };
}
