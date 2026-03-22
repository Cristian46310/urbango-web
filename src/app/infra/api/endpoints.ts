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
  PROFILE: {
    BASE: "/profiles",
    BY_ID: (profileId: string) => `/profiles/${profileId}`,
  },
  USER_ROLE: {
    BASE: (userId: string, roleId: string) =>
      `/user-role/user/${userId}/role/${roleId}`,
  },
};
