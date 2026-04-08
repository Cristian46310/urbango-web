import { useUserStore } from "@/store";
import type { CreateUserDTO, UpdateUserDTO } from "@/core/domain/entities/security/User";

export function useUser() {
  const {
    users,
    loading,
    error,
    fetchUser,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser,
    assignProfileToUser,
    removeProfileFromUser,
    assignSessionToUser,
    removeSessionFromUser,
  } = useUserStore();

  return {
    users,
    loading,
    error,
    loadUsers: () => fetchAllUsers(),
    getUserById: (userId: string) => fetchUser(userId),
    addUser: (userData: CreateUserDTO) => createUser(userData),
    editUser: (userId: string, userData: UpdateUserDTO) => updateUser(userId, userData),
    removeUser: (userId: string) => deleteUser(userId),
    assignProfile: (userId: string, profileId: string) => assignProfileToUser(userId, profileId),
    unassignProfile: (userId: string, profileId: string) => removeProfileFromUser(userId, profileId),
    assignSession: (userId: string, sessionId: string) => assignSessionToUser(userId, sessionId),
    unassignSession: (userId: string, sessionId: string) => removeSessionFromUser(userId, sessionId),
  };
}
