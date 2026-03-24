export const ENDPOINTS = {
  SECURITY: {
    LOGIN: "/security/login",
  },
  USER: {
    BASE: "/users",
    BY_ID: (id: string) => `/users/${id}`,
    SESSION: {
      BASE: (userId: string, sessionId: string) =>
        `/users/${userId}/sessions/${sessionId}`,
    },
    PROFILE: {
      BASE: (userId: string, profileId: string) =>
        `/users/${userId}/profile/${profileId}`,
    },
  },
  SESSION: {
    BASE: "/sessions",
    BY_ID: (sessionId: string) => `/sessions/${sessionId}`,
  },
  ROLE: {
    BASE: "/roles",
    BY_ID: (roleId: string) => `/roles/${roleId}`,
  },
  PROFILE: {
    BASE: "/profiles",
    BY_ID: (profileId: string) => `/profiles/${profileId}`,
  },
  USER_ROLE: {
    BY_ID: (userRoleId: string) => `/user-role/${userRoleId}`,
    BASE: (userId: string, roleId: string) =>
      `/user-role/user/${userId}/role/${roleId}`,
  },
};
