import type {
  CardRechargeCheckoutPayload,
  CardRechargeCheckoutResult,
  CardRechargeConfig,
  CardRechargePreview,
  CardRechargeTransactionStatus,
  PreviewCardRechargePayload,
  RechargeableCard,
} from '@/core/domain/entities/business/CardRecharge';
import { normalizeStatusPollUrl } from '@/lib/card-recharge-payment';
import { httpMsBussines } from '@/infra/api/builderHttp';
import { ENDPOINTS } from '@/infra/api/endpoints';

const DEFAULT_PREDEFINED_AMOUNTS = [10_000, 20_000, 50_000, 100_000];
const DEFAULT_MIN_AMOUNT = 5_000;
const DEFAULT_MAX_AMOUNT = 500_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function unwrapData(value: unknown): unknown {
  const record = asRecord(value);
  if (record && 'data' in record) {
    return record.data;
  }
  return value;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value === 'true' || value === '1';
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function mapConfig(raw: unknown): CardRechargeConfig {
  const record = asRecord(unwrapData(raw)) ?? {};

  const predefinedAmounts = Array.isArray(record.predefinedAmounts)
    ? record.predefinedAmounts.map((item) => toNumber(item)).filter((item) => item > 0)
    : Array.isArray(record.presetAmounts)
      ? record.presetAmounts.map((item) => toNumber(item)).filter((item) => item > 0)
      : DEFAULT_PREDEFINED_AMOUNTS;

  return {
    predefinedAmounts:
      predefinedAmounts.length > 0
        ? predefinedAmounts
        : DEFAULT_PREDEFINED_AMOUNTS,
    minAmount: toNumber(record.minAmount, DEFAULT_MIN_AMOUNT),
    maxAmount: toNumber(record.maxAmount, DEFAULT_MAX_AMOUNT),
    commissionRate: toNumber(record.commissionRate, 0) || undefined,
    commissionFixed: toNumber(record.commissionFixed, 0) || undefined,
    epaycoTestMode: toBoolean(
      record.epaycoTestMode ?? record.testMode,
      import.meta.env.VITE_EPAYCO_TEST !== 'false',
    ),
    currency: toStringValue(record.currency, 'COP') || 'COP',
  };
}

function mapCard(raw: unknown): RechargeableCard | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const id = toStringValue(
    record.id ?? record.paymentMethodCitizenId ?? record.payment_method_citizen_id,
  );
  if (!id) {
    return null;
  }

  const cardNumber = toStringValue(
    record.cardNumber ?? record.maskedNumber ?? record.number ?? record.card_number,
  );
  const label =
    toStringValue(record.label ?? record.displayName ?? record.name) ||
    (cardNumber ? `Tarjeta #${cardNumber}` : `Tarjeta ${id.slice(0, 8)}`);

  return {
    id,
    label,
    cardNumber: cardNumber || undefined,
    balance: toNumber(record.balance ?? record.currentBalance ?? record.saldo),
  };
}

function mapCards(raw: unknown): RechargeableCard[] {
  const unwrapped = unwrapData(raw);
  if (Array.isArray(unwrapped)) {
    return unwrapped
      .map(mapCard)
      .filter((card): card is RechargeableCard => card !== null);
  }

  const record = asRecord(unwrapped);
  const items = record?.items ?? record?.cards;
  if (Array.isArray(items)) {
    return items
      .map(mapCard)
      .filter((card): card is RechargeableCard => card !== null);
  }

  return [];
}

function mapPreview(raw: unknown, amount: number): CardRechargePreview {
  const record = asRecord(unwrapData(raw)) ?? {};
  const currentBalance = toNumber(
    record.currentBalance ?? record.balanceBefore ?? record.saldoActual,
  );
  const rechargeAmount = toNumber(record.rechargeAmount ?? record.amount, amount);
  const commission = toNumber(record.commission ?? record.fee ?? record.comision);
  const balanceAfterRecharge = toNumber(
    record.balanceAfterRecharge ??
      record.balanceAfter ??
      record.saldoDespues ??
      currentBalance + rechargeAmount,
  );
  const totalToPay = toNumber(
    record.totalToPay ?? record.total ?? record.totalAmount,
    rechargeAmount + commission,
  );

  return {
    currentBalance,
    balanceAfterRecharge,
    rechargeAmount,
    commission,
    totalToPay,
    commissionApplies: commission > 0 || toBoolean(record.commissionApplies),
    commissionLabel: toStringValue(
      record.commissionLabel ?? record.commissionDescription,
    ) || undefined,
  };
}

function mapCheckout(raw: unknown): CardRechargeCheckoutResult {
  const record = asRecord(unwrapData(raw)) ?? {};
  const sessionId = toStringValue(record.sessionId ?? record.session_id);
  const reference = toStringValue(record.reference ?? record.invoice ?? record.ref);

  if (!sessionId || !reference) {
    throw new Error('Respuesta de checkout incompleta');
  }

  const statusPollUrl =
    toStringValue(record.statusPollUrl) ||
    `/card-recharge/transactions/${reference}/status`;

  return {
    sessionId,
    reference,
    statusPollUrl,
    description: toStringValue(record.description) || undefined,
    amount: toNumber(record.amount ?? record.totalToPay),
    test: toBoolean(record.test ?? record.testMode ?? record.epaycoTestMode, true),
  };
}

function mapTransactionStatus(raw: unknown): CardRechargeTransactionStatus {
  const record = asRecord(unwrapData(raw)) ?? {};
  const reference = toStringValue(record.reference ?? record.invoice ?? record.ref);

  return {
    reference,
    status: toStringValue(record.status ?? record.state, 'pending'),
    rechargeAmount: toNumber(record.rechargeAmount ?? record.amount, 0) || undefined,
    totalPaid: toNumber(record.totalPaid ?? record.totalToPay, 0) || undefined,
    commission: toNumber(record.commission, 0) || undefined,
    cardLabel: toStringValue(record.cardLabel ?? record.description) || undefined,
    message: toStringValue(record.message ?? record.statusMessage) || undefined,
    balanceAfter:
      toNumber(
        record.balanceAfter ?? record.balanceAfterRecharge ?? record.currentBalance,
        0,
      ) || undefined,
  };
}

export const cardRechargeRepository = {
  async getConfig(): Promise<CardRechargeConfig> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.CARD_RECHARGE.CONFIG);
    return mapConfig(response);
  },

  async listCards(): Promise<RechargeableCard[]> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.CARD_RECHARGE.CARDS);
    return mapCards(response);
  },

  async preview(payload: PreviewCardRechargePayload): Promise<CardRechargePreview> {
    const response = await httpMsBussines.post<unknown>(
      ENDPOINTS.CARD_RECHARGE.PREVIEW,
      payload,
    );
    return mapPreview(response, payload.amount);
  },

  async checkout(payload: CardRechargeCheckoutPayload): Promise<CardRechargeCheckoutResult> {
    const response = await httpMsBussines.post<unknown>(
      ENDPOINTS.CARD_RECHARGE.CHECKOUT,
      payload,
    );
    return mapCheckout(response);
  },

  async getTransactionStatus(reference: string): Promise<CardRechargeTransactionStatus> {
    const response = await httpMsBussines.get<unknown>(
      ENDPOINTS.CARD_RECHARGE.TRANSACTION_STATUS(reference),
    );
    return mapTransactionStatus(response);
  },

  async getTransactionStatusByPollUrl(
    statusPollUrl: string,
  ): Promise<CardRechargeTransactionStatus> {
    const endpoint = normalizeStatusPollUrl(statusPollUrl);
    const response = await httpMsBussines.get<unknown>(endpoint);
    return mapTransactionStatus(response);
  },
};
