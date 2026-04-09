/**
 * reCAPTCHA v3 Configuration
 */

export const recaptchaConfig = {
  siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || "",
  actions: {
    login: "login",
  },
};
