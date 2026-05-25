import { httpMsBussines } from '@/infra/api/builderHttp';
import { ENDPOINTS } from '@/infra/api/endpoints';

export interface CitizenPaymentMethodOption {
  id: string;
  balance: number;
  label: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
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

function mapPaymentMethodOption(raw: unknown): CitizenPaymentMethodOption | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const id = toStringValue(record.id);
  if (!id) {
    return null;
  }

  const paymentMethod = asRecord(record.paymentMethod);
  const methodName = toStringValue(paymentMethod?.name);
  const cardDisplay =
    toStringValue(record.cardDisplay) ||
    (record.cardNumber ? `Tarjeta #${toStringValue(record.cardNumber)}` : '');

  const label =
    methodName && cardDisplay
      ? `${methodName} — ${cardDisplay}`
      : methodName || cardDisplay || `Método ${id.slice(0, 8)}`;

  return {
    id,
    balance: toNumber(record.balance ?? record.currentBalance),
    label,
  };
}

function unwrapItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  const record = asRecord(raw);
  if (record && Array.isArray(record.items)) {
    return record.items;
  }
  return [];
}

export const paymentMethodCitizenRepository = {
  async listMine(): Promise<CitizenPaymentMethodOption[]> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.PAYMENT_METHOD_CITIZEN.ME);
    return unwrapItems(response)
      .map(mapPaymentMethodOption)
      .filter((item): item is CitizenPaymentMethodOption => item !== null);
  },
};
