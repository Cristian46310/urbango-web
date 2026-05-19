/**
 * reCAPTCHA v3 Configuration
 */

interface RecaptchaConfig {
  siteKey: string;
  actions: {
    login: string;
    forgotPassword: string;
  };
}

export const recaptchaConfig: RecaptchaConfig = {
  siteKey: (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined) ?? "",
  actions: {
    login: "login",
    forgotPassword: "forgot_password",
  },
};
