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
    REFRESH_TOKEN: "/api/public/security/refresh-token",
    ME: "/api/public/security/me",
  },
  USER: {
    BASE: "/api/users",
    BY_ID: (id: string) => `/api/users/${id}`,
    SESSION: {
      BASE: (userId: string, sessionId: string) =>
        `/api/users/${userId}/sessions/${sessionId}`,
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
  PERMISSION: {
    BASE: "/api/permissions",
    BY_ID: (permissionId: string) => `/api/permissions/${permissionId}`,
  },
  USER_ROLE: {
    BY_ID: (userRoleId: string) => `/api/user-role/${userRoleId}`,
    BASE: (userId: string, roleId: string) =>
      `/api/user-role/user/${userId}/role/${roleId}`,
    ASSIGN_MULTIPLE: "/api/user-role/assign-multiple",
    BY_ROLE_NAME: (userId: string, roleName: string) =>
      `/api/user-role/user/${userId}/role-name/${roleName}`,
  },
  ROLE_PERMISSION: {
    BASE: (roleId: string, permissionId: string) =>
      `/api/role-permission/role/${roleId}/permission/${permissionId}`,
    ASSIGN_MULTIPLE: "/api/role-permission/assign-multiple",
    BY_ID: (rolePermissionId: string) =>
      `/api/role-permission/${rolePermissionId}`,
  },
  STOPS: {
    BASE: "/stop",
    NEARBY: "/stop/nearby",
    BY_ID: (id: string) => `/stop/${id}`,
  },
  ROUTE: {
    BASE: "/route",
    BY_ID: (id: string) => `/route/${id}`,
  },
  NODE: {
    BASE: "/node",
    BY_ID: (id: string) => `/node/${id}`,
    BY_ROUTE_STOP: (routeId: string, stopId: string) =>
      `/node/route/${routeId}/stop/${stopId}`,
  },
  ADDRESS: {
    BASE: "/address",
    BY_ID: (id: string) => `/address/${id}`,
  },
  CITIZEN: {
    BASE: "/citizen",
    ME: "/citizen/me",
    ME_PHOTO: "/citizen/me/photo",
    BY_ID: (id: string) => `/citizen/${id}`,
  },
  TICKET: {
    BASE: "/ticket",
    ME: "/ticket/me",
    BY_ID: (id: string) => `/ticket/${id}`,
    ALIGHT: (id: string) => `/ticket/${id}/alight`,
  },
  BOARDING: "/boarding",
  HISTORY: {
    BASE: "/history",
    TRIP_DETAILS: (id: string) => `/history/${id}/trip-details`,
  },
  GPS: {
    BUS: (busId: string) => `/gps/bus/${busId}`,
  },
  BUS: {
    BASE: "/bus",
    FLEET: "/bus/fleet",
    BY_ID: (id: string) => `/bus/${id}`,
    PHOTO: (busId: string) => `/bus-photo/bus/${busId}`,
    PHOTO_BY_ID: (id: string) => `/bus-photo/${id}`,
  },
  SCHEDULER: {
    BASE: "/scheduler",
    BY_ID: (id: string) => `/scheduler/${id}`,
  },
  PAYMENT_METHOD: {
    BASE: "/payment-method",
    BY_ID: (id: string) => `/payment-method/${id}`,
  },
  PAYMENT_METHOD_CITIZEN: {
    BASE: "/payment-method-citizen",
    ME: "/payment-method-citizen/me",
    BY_ID: (id: string) => `/payment-method-citizen/${id}`,
  },
  ENTERPRISE: {
    BASE: "/enterprise",
    BY_ID: (id: string) => `/enterprise/${id}`,
  },
  DRIVER: {
    BASE: "/driver",
    ADMIN: "/driver/admin",
    ME: "/driver/me",
    ME_PHOTO: "/driver/me/photo",
    BY_ID: (id: string) => `/driver/${id}`,
  },
  SUPERVISOR: {
    BASE: "/supervisor",
    ME: "/supervisor/me",
    BY_ID: (id: string) => `/supervisor/${id}`,
  },
  TURN: {
    BASE: "/turn",
    START: "/turn/start",
    END: "/turn/end",
    CURRENT: "/turn/current",
    GPS: "/turn/gps",
    BY_ID: (id: string) => `/turn/${id}`,
  },
  INCIDENT_REPORTS: {
    BASE: "/incident-reports/driver",
    LIST: "/incident-reports",
    BY_BUS: (busId: string) => `/incident-reports/bus/${busId}`,
    COMMENTS: (incidentId: string) => `/incident-reports/${incidentId}/comments`,
    STATUS: (incidentId: string) => `/incident-reports/${incidentId}/status`,
  },
  DASHBOARD: {
    PAYMENT_METHOD_INCOME: "/dashboard/payment-method-income",
    PAYMENT_METHOD_INCOME_EXPORT: "/dashboard/payment-method-income/export",
    INCIDENT_TREND: "/dashboard/incident-trend-by-type",
    INCIDENT_TREND_EXPORT: "/dashboard/incident-trend-by-type/export",
    REALTIME: {
      FLEET: "/dashboard/realtime/fleet",
      SUMMARY: "/dashboard/realtime/summary",
      BUS_BY_ID: (busId: string) => `/dashboard/realtime/bus/${busId}`,
      INCIDENTS: "/dashboard/realtime/incidents",
      ARRIVAL_NOTIFICATION: "/dashboard/realtime/arrival-notification",
    },
  },
  CARD_RECHARGE: {
    CONFIG: '/card-recharge/config',
    CARDS: '/card-recharge/cards',
    CARDS_REGISTER: '/card-recharge/cards/register',
    PREVIEW: '/card-recharge/preview',
    CHECKOUT: '/card-recharge/checkout',
    TRANSACTION_STATUS: (reference: string) =>
      `/card-recharge/transactions/${reference}/status`,
  },
  MESSAGES: {
    USERS_SEARCH: "/users/search",
    CONVERSATIONS_DIRECT: "/conversations/direct",
    CONVERSATION_MESSAGES: (conversationId: string) =>
      `/conversations/${conversationId}/messages`,
    DIRECT: "/messages/direct",
    INBOX: "/inbox",
    INBOX_UNREAD_COUNT: "/inbox/unread-count",
    SENT: "/messages/sent",
    BY_ID: (messageId: string) => `/messages/${messageId}`,
    READ: (messageId: string) => `/messages/${messageId}/read`,
    HEALTH: "/health",
    GROUPS: {
      BASE: "/groups",
      PUBLIC: "/groups/public",
      ME: "/groups/me",
      BY_ID: (groupId: string) => `/groups/${groupId}`,
      MESSAGES: (groupId: string) => `/groups/${groupId}/messages`,
      JOIN: (groupId: string) => `/groups/${groupId}/join`,
      LEAVE: (groupId: string) => `/groups/${groupId}/leave`,
      MEMBERS: (groupId: string) => `/groups/${groupId}/members`,
      MEMBER_BY_ID: (groupId: string, userId: string) =>
        `/groups/${groupId}/members/${userId}`,
      MEMBER_ROLE: (groupId: string, userId: string) =>
        `/groups/${groupId}/members/${userId}/role`,
      MEMBERSHIP_LOG: (groupId: string) => `/groups/${groupId}/membership-log`,
      ICON: (groupId: string) => `/groups/${groupId}/icon`,
    },
    GROUP_MESSAGE: "/messages/group",
    MESSAGE_READS: (messageId: string) => `/messages/${messageId}/reads`,
    DELETE_MESSAGE: (messageId: string) => `/messages/${messageId}`,
  },
  ALERTS: {
    BASE: "/alerts",
    UNREAD_COUNT: "/alerts/unread-count",
    BY_ID: (alertId: string) => `/alerts/${alertId}`,
    READ: (alertId: string) => `/alerts/${alertId}/read`,
  },
  MASS_ALERTS: {
    BASE: "/mass-alerts",
    PREVIEW: "/mass-alerts/preview-recipients",
    BY_ID: (alertId: string) => `/mass-alerts/${alertId}`,
    STATS: (alertId: string) => `/mass-alerts/${alertId}/stats`,
  },
  APPOINTMENTS: {
    BASE: "/api/appointments",
    AVAILABILITY: "/api/appointments/availability",
    BY_USER: (userId: string) => `/api/appointments/user/${userId}`,
    BY_ID: (id: string) => `/api/appointments/${id}`,
  },
  PQRS: {
    BASE: "/api/pqrs",
    BY_TICKET: (ticketNumber: string) => `/api/pqrs/ticket/${ticketNumber}`,
    BY_ID: (pqrsId: string) => `/api/pqrs/${pqrsId}`,
    UPDATES: (pqrsId: string) => `/api/pqrs/${pqrsId}/updates`,
    UPDATE_BY_ID: (pqrsId: string, updateId: string) => `/api/pqrs/${pqrsId}/updates/${updateId}`,
  },
  WEATHER: {
    ALERTS: "/api/weather/alerts",
    ALERTS_BY_USER: (userId: string) => `/api/weather/alerts/user/${userId}`,
    ALERT_BY_ID: (alertId: string) => `/api/weather/alerts/${alertId}`,
    FORECAST_HOURS: "/api/weather/forecast/available-hours",
    ASSESS: "/api/weather/assess",
  },
};
