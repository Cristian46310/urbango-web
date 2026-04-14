/**
 * OAuth Configuration
 */

interface OauthConfig {
  google: {
    clientId: string;
    scope: string;
  };
}

export const oauthConfig: OauthConfig = {
  google: {
    clientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "",
    scope: (import.meta.env.VITE_GOOGLE_SCOPE as string | undefined) ?? "",
  },
};
