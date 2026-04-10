/**
 * OAuth Configuration
 */

export const oauthConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    scope: import.meta.env.VITE_GOOGLE_SCOPE || '',
  },
};
