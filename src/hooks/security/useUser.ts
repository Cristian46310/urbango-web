import { useMemo } from "react";
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
    assignProfileToUser,
    removeProfileFromUser,
    assignSessionToUser,
    removeSessionFromUser,
  } = useUserStore();

  return useMemo(() => ({
    users,
    usersPage,
    loading,
    error,
    loadUsers: (pageable?: PageableQuery) => fetchAllUsers(pageable),
    getUserById: (userId: string) => fetchUser(userId),
    addUser: (userData: CreateUserDTO) => createUser(userData),
    editUser: (userId: string, userData: UpdateUserDTO) => updateUser(userId, userData),
    removeUser: (userId: string) => deleteUser(userId),
    assignProfile: (userId: string, profileId: string) => assignProfileToUser(userId, profileId),
    unassignProfile: (userId: string, profileId: string) => removeProfileFromUser(userId, profileId),
    assignSession: (userId: string, sessionId: string) => assignSessionToUser(userId, sessionId),
    unassignSession: (userId: string, sessionId: string) => removeSessionFromUser(userId, sessionId),
  }), [users, usersPage, loading, error]);
}
