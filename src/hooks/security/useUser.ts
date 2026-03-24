import { useUserStore } from "@/store";
import type { User } from "@/core/domain/entities/security/User";

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
  } = useUserStore();

  return {
    users,
    loading,
    error,
    loadUsers: () => fetchAllUsers(),
    getUserById: (userId: string) => fetchUser(userId),
    addUser: (userData: User) => createUser(userData),
    editUser: (userId: string, userData: User) => updateUser(userId, userData),
    removeUser: (userId: string) => deleteUser(userId),
  };
}
