export interface EPaycoCheckoutInstance {
  open: () => void;
  onCreated: (callback: () => void) => void;
  onErrors: (callback: (errors: unknown) => void) => void;
  onClosed: (callback: () => void) => void;
}

export interface EPaycoCheckoutApi {
  configure: (options: {
    sessionId: string;
    type?: 'onpage' | 'standard';
    test?: boolean;
  }) => EPaycoCheckoutInstance;
}

declare global {
  interface Window {
    ePayco?: {
      checkout: EPaycoCheckoutApi;
    };
  }
}

export {};
