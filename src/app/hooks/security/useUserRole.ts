import { useUserRoleStore } from "@/app/store";

export function useUserRole() {
  const {
    loading,
    error,
    assignRole,
    removeRole,
  } = useUserRoleStore();

  return {
    loading,
    error,
    assignRoleToUser: (userId: string, roleId: string) => assignRole(userId, roleId),
    removeRoleFromUser: (userRoleId: string) => removeRole(userRoleId),
  };
}
