const STORAGE_KEY = 'cardRecharge.returnTo';
const PENDING_REFERENCE_KEY = 'cardRecharge.pendingReference';
const PENDING_STATUS_POLL_URL_KEY = 'cardRecharge.pendingStatusPollUrl';
const DEFAULT_RETURN_PATH = '/app/card-recharge';

const EPAYCO_REFERENCE_KEYS = [
  'x_id_invoice',
  'ref_payco',
  'x_ref_payco',
  'reference',
  'invoice',
  'ref',
  'id_factura',
] as const;

function isSafeReturnPath(path: string): boolean {
  if (!path.startsWith('/app')) {
    return false;
  }
  if (path.includes('//') || path.includes('://')) {
    return false;
  }
  return true;
}

export function saveCardRechargeReturnTo(path: string): void {
  if (!isSafeReturnPath(path)) {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, path);
}

export function resolveCardRechargeReturnTo(
  returnToParam: string | null | undefined,
): string {
  const decoded = returnToParam?.trim()
    ? decodeURIComponent(returnToParam.trim())
    : '';

  if (decoded && isSafeReturnPath(decoded)) {
    return decoded;
  }

  const fromStorage = sessionStorage.getItem(STORAGE_KEY);
  if (fromStorage && isSafeReturnPath(fromStorage)) {
    return fromStorage;
  }

  return DEFAULT_RETURN_PATH;
}

export function clearCardRechargeReturnTo(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function savePendingCheckoutReference(reference: string): void {
  sessionStorage.setItem(PENDING_REFERENCE_KEY, reference);
}

export function getPendingCheckoutReference(): string {
  return sessionStorage.getItem(PENDING_REFERENCE_KEY)?.trim() ?? '';
}

export function clearPendingCheckoutReference(): void {
  sessionStorage.removeItem(PENDING_REFERENCE_KEY);
}

export function savePendingStatusPollUrl(statusPollUrl: string): void {
  if (statusPollUrl.trim()) {
    sessionStorage.setItem(PENDING_STATUS_POLL_URL_KEY, statusPollUrl.trim());
  }
}

export function getPendingStatusPollUrl(): string {
  return sessionStorage.getItem(PENDING_STATUS_POLL_URL_KEY)?.trim() ?? '';
}

export function clearPendingStatusPollUrl(): void {
  sessionStorage.removeItem(PENDING_STATUS_POLL_URL_KEY);
}

export function clearPendingCheckoutSession(): void {
  clearPendingCheckoutReference();
  clearPendingStatusPollUrl();
}

export function resolvePaymentReference(
  searchParams: URLSearchParams,
): string {
  for (const key of EPAYCO_REFERENCE_KEYS) {
    const value = searchParams.get(key)?.trim();
    if (value) {
      return value;
    }
  }
  return getPendingCheckoutReference();
}

/**
 * URL de respuesta para la sesión ePayco (campo `response`).
 * Debe ser el endpoint del backend; ePayco redirige ahí y el API reenvía al front.
 */
export function buildEpaycoResponseUrl(returnTo: string): string {
  const businessBase = (
    import.meta.env.VITE_URL_MS_BUSSINES as string | undefined
  )?.replace(/\/$/, '') ?? 'http://localhost:3000';
  const params = new URLSearchParams({ returnTo });
  return `${businessBase}/card-recharge/return?${params.toString()}`;
}
