/**
 * OAuth Configuration
 */

export const oauthConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '114903019947-mdk7na96uuk8fnv1rr8campushbd8ln5.apps.googleusercontent.com',
    scope: 'openid,profile,email',
  },
};
