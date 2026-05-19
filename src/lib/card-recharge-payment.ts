import type { CardRechargeTransactionState } from '@/core/domain/entities/business/CardRecharge';

const TERMINAL_STATUSES = new Set([
  'approved',
  'aceptada',
  'accepted',
  'rejected',
  'rechazada',
  'failed',
  'fallida',
  'cancelled',
  'cancelada',
]);

export function isTerminalPaymentStatus(
  status: CardRechargeTransactionState,
): boolean {
  return TERMINAL_STATUSES.has(status.toLowerCase());
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Normaliza statusPollUrl del checkout (ruta relativa al API de negocio). */
export function normalizeStatusPollUrl(pollUrl: string): string {
  const trimmed = pollUrl.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).pathname + new URL(trimmed).search;
    } catch {
      return trimmed;
    }
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
