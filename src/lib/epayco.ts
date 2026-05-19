import type { EPaycoCheckoutInstance } from '@/types/epayco';

const EPAYCO_SCRIPT_URL = 'https://checkout.epayco.co/checkout-v2.js';

let scriptLoadPromise: Promise<void> | null = null;

function loadEpaycoScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('ePayco solo está disponible en el navegador'));
  }

  if (window.ePayco?.checkout) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${EPAYCO_SCRIPT_URL}"]`,
    );

    if (existing) {
      existing.addEventListener('load', () => { resolve(); });
      existing.addEventListener('error', () => {
        reject(new Error('No se pudo cargar el checkout de ePayco'));
      });
      if (window.ePayco?.checkout) {
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = EPAYCO_SCRIPT_URL;
    script.async = true;
    script.onload = () => { resolve(); };
    script.onerror = () => {
      reject(new Error('No se pudo cargar el checkout de ePayco'));
    };
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

export interface OpenEpaycoCheckoutOptions {
  sessionId: string;
  test?: boolean;
  /** "standard" redirige a ePayco y vuelve por response URL; "onpage" abre modal embebido */
  type?: 'onpage' | 'standard';
  onClosed?: () => void;
  onError?: (error: unknown) => void;
}

export async function openEpaycoCheckout(
  options: OpenEpaycoCheckoutOptions,
): Promise<EPaycoCheckoutInstance> {
  await loadEpaycoScript();

  if (!window.ePayco?.checkout) {
    throw new Error('ePayco no está disponible');
  }

  const checkout = window.ePayco.checkout.configure({
    sessionId: options.sessionId,
    type: options.type ?? 'onpage',
    test: options.test ?? true,
  });

  checkout.onErrors((errors) => {
    options.onError?.(errors);
  });

  checkout.onClosed(() => {
    options.onClosed?.();
  });

  checkout.open();
  return checkout;
}
