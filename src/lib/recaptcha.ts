import { recaptchaConfig } from "@/config/recaptcha";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SCRIPT_ID = "google-recaptcha-v3";
let scriptLoadPromise: Promise<void> | null = null;

function waitForGrecaptcha(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const checkReady = () => {
      if (window.grecaptcha?.ready) {
        resolve();
        return;
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error("reCAPTCHA did not initialize in time"));
        return;
      }

      window.setTimeout(checkReady, 50);
    };

    checkReady();
  });
}

function loadRecaptchaScript(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA only runs in the browser");
  }

  const siteKey = recaptchaConfig.siteKey;
  if (!siteKey) {
    throw new Error("VITE_RECAPTCHA_SITE_KEY is not configured");
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID);

    const handleResolve = () => {
      waitForGrecaptcha()
        .then(() => { resolve(); })
        .catch((error: unknown) => {
          scriptLoadPromise = null;
          reject(error instanceof Error ? error : new Error("Failed to initialize reCAPTCHA"));
        });
    };

    const handleReject = () => {
      scriptLoadPromise = null;
      reject(new Error("Failed to load reCAPTCHA script"));
    };

    if (existingScript) {
      if (window.grecaptcha?.ready) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", handleResolve, { once: true });
      existingScript.addEventListener("error", handleReject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = handleResolve;
    script.onerror = handleReject;

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export async function executeRecaptcha(action: string): Promise<string> {
  await loadRecaptchaScript();

  const siteKey = recaptchaConfig.siteKey;
  const grecaptcha = window.grecaptcha;

  if (!siteKey || !grecaptcha) {
    throw new Error("reCAPTCHA is not available");
  }

  return new Promise((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute(siteKey, { action })
        .then(resolve)
        .catch(() => { reject(new Error("Failed to get reCAPTCHA token")); });
    });
  });
}
