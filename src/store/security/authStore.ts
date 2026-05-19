import { create } from 'zustand';
import { AuthService, type DecodedToken } from '@/services/AuthService';

interface AuthStoreState {
  isAuthenticated: boolean;
  currentUser: {
    id: string;
    email: string;
    roles: string[];
  } | null;
  decodedToken: DecodedToken | null;
  isInitialized: boolean;

  initializeAuth: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: readonly string[]) => boolean;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  isAuthenticated: false,
  currentUser: null,
  decodedToken: null,
  isInitialized: false,

  initializeAuth: () => {
    const token = AuthService.getToken();

    if (!token || AuthService.isTokenExpired(token)) {
      AuthService.removeToken();
      set({
        isAuthenticated: false,
        currentUser: null,
        decodedToken: null,
        isInitialized: true,
      });
      return;
    }

    const decodedToken = AuthService.decodeToken(token);
    if (!decodedToken) {
      AuthService.removeToken();
      set({
        isAuthenticated: false,
        currentUser: null,
        decodedToken: null,
        isInitialized: true,
      });
      return;
    }

    const userId =
      typeof decodedToken.id === 'string'
        ? decodedToken.id
        : decodedToken.sub;

    const currentUser = {
      id: userId,
      email: decodedToken.email,
      roles: decodedToken.roles,
    };

    set({
      isAuthenticated: true,
      currentUser,
      decodedToken,
      isInitialized: true,
    });
  },

  hasRole: (role: string): boolean => {
    return AuthService.hasRole(role);
  },

  hasAnyRole: (roles: readonly string[]): boolean => {
    return AuthService.hasAnyRole(roles);
  },

  logout: () => {
    AuthService.logout();
    set({
      isAuthenticated: false,
      currentUser: null,
      decodedToken: null,
    });
  },

  setToken: (token: string) => {
    AuthService.saveToken(token);

    const decodedToken = AuthService.decodeToken(token);
    if (!decodedToken) {
      set({
        isAuthenticated: false,
        currentUser: null,
        decodedToken: null,
      });
      return;
    }

    const userId =
      typeof decodedToken.id === 'string'
        ? decodedToken.id
        : decodedToken.sub;

    const currentUser = {
      id: userId,
      email: decodedToken.email,
      roles: decodedToken.roles,
    };

    set({
      isAuthenticated: true,
      currentUser,
      decodedToken,
    });
  },
}));
