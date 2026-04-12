export const ENDPOINTS = {
  SECURITY: {
    LOGIN: "/api/public/security/login",
    REGISTER: "/api/public/security/register",
    FORGOT_PASSWORD: "/api/public/security/forgot-password",
    RESET_PASSWORD: "/api/public/security/reset-password",
    VERIFY_2FA: "/api/public/security/verify-2fa",
    LOGIN_GOOGLE: "/api/public/security/login/google",
    LOGIN_GITHUB_AUTHORIZE: "/api/public/security/login/github/authorize",
    LOGIN_GITHUB: "/api/public/security/login/github",
    LOGIN_GITHUB_COMPLETE: "/api/public/security/login/github/complete",
    LOGIN_MICROSOFT_AUTHORIZE: "/api/public/security/login/microsoft/authorize",
    LOGIN_MICROSOFT: "/api/public/security/login/microsoft",
    LOGIN_MICROSOFT_COMPLETE: "/api/public/security/login/microsoft/complete",
  },
  USER: {
    BASE: "/api/public/users",
    BY_ID: (id: string) => `/api/public/users/${id}`,
    SESSION: {
      BASE: (userId: string, sessionId: string) =>
        `/api/public/users/${userId}/sessions/${sessionId}`,
    },
    PROFILE: {
      BASE: (userId: string, profileId: string) =>
        `/api/public/users/${userId}/profile/${profileId}`,
    },
  },
  SESSION: {
    BASE: "/api/sessions",
    BY_ID: (sessionId: string) => `/api/sessions/${sessionId}`,
  },
  ROLE: {
    BASE: "/api/roles",
    BY_ID: (roleId: string) => `/api/roles/${roleId}`,
  },
  PROFILE: {
    BASE: "/api/profiles",
    BY_ID: (profileId: string) => `/api/profiles/${profileId}`,
  },
  PERMISSION: {
    BASE: "/api/permissions",
    BY_ID: (permissionId: string) => `/api/permissions/${permissionId}`,
  },
  USER_ROLE: {
    BY_ID: (userRoleId: string) => `/api/public/user-role/${userRoleId}`,
    BASE: (userId: string, roleId: string) =>
      `/api/public/user-role/user/${userId}/role/${roleId}`,
    ASSIGN_MULTIPLE: "/api/public/user-role/assign-multiple",
  },
  ROLE_PERMISSION: {
    BASE: (roleId: string, permissionId: string) =>
      `/api/role-permission/role/${roleId}/permission/${permissionId}`,
    ASSIGN_MULTIPLE: "/api/role-permission/assign-multiple",
    BY_ID: (rolePermissionId: string) =>
      `/api/role-permission/${rolePermissionId}`,
  },
};
