import { useAuthStore } from '@/store/security/authStore';

export function useAuth() {
  const {
    isAuthenticated,
    isInitialized,
    currentUser,
    hasRole,
    hasAnyRole,
    logout,
  } = useAuthStore();

  return {
    isAuthenticated,
    isInitialized,
    currentUser,
    hasRole,
    hasAnyRole,
    logout,
  };
}
