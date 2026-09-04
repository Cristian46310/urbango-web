import type {
  LinkMyPaymentMethodDTO,
  PaymentMethod,
  PaymentMethodCitizen,
  PaymentMethodCode,
} from '@/core/domain/entities/business';
import { httpMsBussines } from '@/infra/api/builderHttp';
import { ENDPOINTS } from '@/infra/api/endpoints';

export interface CitizenPaymentMethodOption {
  /** paymentMethodCitizenId — use this for boarding / recharge. */
  id: string;
  paymentMethodId: string;
  balance: number;
  label: string;
  code?: PaymentMethodCode;
  isRechargeable?: boolean;
  name?: string;
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

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value === 'true' || value === '1';
  }
  return fallback;
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

function mapPaymentMethod(raw: unknown): PaymentMethod | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }
  const id = toStringValue(record.id);
  const name = toStringValue(record.name);
  if (!id || !name) {
    return null;
  }
  const code = toStringValue(record.code) || undefined;
  return {
    id,
    name,
    code: code as PaymentMethodCode | undefined,
    isRechargeable:
      record.isRechargeable !== undefined
        ? toBoolean(record.isRechargeable)
        : code === 'SYSTEM_CARD',
    createdAt: toStringValue(record.createdAt) || undefined,
  };
}

function mapLink(raw: unknown): CitizenPaymentMethodOption | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const id = toStringValue(record.id);
  if (!id) {
    return null;
  }

  const paymentMethodRaw = asRecord(record.paymentMethod ?? record.payment_method);
  const mappedMethod = paymentMethodRaw ? mapPaymentMethod(paymentMethodRaw) : null;
  const paymentMethodId = toStringValue(
    record.paymentMethodId ?? record.payment_method_id ?? mappedMethod?.id,
  );
  const methodName = mappedMethod?.name ?? toStringValue(paymentMethodRaw?.name);
  const cardDisplay =
    toStringValue(record.cardDisplay) ||
    (record.cardNumber ? `Tarjeta #${toStringValue(record.cardNumber)}` : '');

  const label =
    methodName && cardDisplay
      ? `${methodName} — ${cardDisplay}`
      : methodName || cardDisplay || `Método ${id.slice(0, 8)}`;

  const codeRaw =
    mappedMethod?.code || toStringValue(paymentMethodRaw?.code) || undefined;
  const code = codeRaw as PaymentMethodCode | undefined;

  return {
    id,
    paymentMethodId,
    balance: toNumber(record.balance ?? record.currentBalance),
    label,
    code,
    isRechargeable:
      mappedMethod?.isRechargeable ??
      (paymentMethodRaw?.isRechargeable !== undefined
        ? toBoolean(paymentMethodRaw.isRechargeable)
        : code === 'SYSTEM_CARD'),
    name: methodName || undefined,
  };
}

function mapPaymentMethodCitizen(raw: unknown): PaymentMethodCitizen | null {
  const option = mapLink(raw);
  if (!option) {
    return null;
  }
  const record = asRecord(raw);
  return {
    id: option.id,
    citizenId: toStringValue(record?.citizenId ?? record?.citizen_id),
    paymentMethodId: option.paymentMethodId,
    balance: option.balance,
    paymentMethod: option.paymentMethodId
      ? {
          id: option.paymentMethodId,
          name: option.name ?? option.label,
          code: option.code,
          isRechargeable: option.isRechargeable,
        }
      : undefined,
    createdAt: toStringValue(record?.createdAt) || undefined,
  };
}

/**
 * Citizen self-service for payment-method-citizen (/me).
 * Admin CRUD lives in `infra/repository/business/repositories.ts`.
 */
export const myPaymentMethodCitizenRepository = {
  async listCatalog(): Promise<PaymentMethod[]> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.PAYMENT_METHOD.BASE, {
      params: { page: 1, limit: 100 },
    });
    return unwrapItems(response)
      .map(mapPaymentMethod)
      .filter((item): item is PaymentMethod => item !== null);
  },

  async listMine(): Promise<CitizenPaymentMethodOption[]> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.PAYMENT_METHOD_CITIZEN.ME);
    return unwrapItems(response)
      .map(mapLink)
      .filter((item): item is CitizenPaymentMethodOption => item !== null);
  },

  async linkMine(payload: LinkMyPaymentMethodDTO): Promise<PaymentMethodCitizen> {
    const raw = await httpMsBussines.post<unknown>(
      ENDPOINTS.PAYMENT_METHOD_CITIZEN.ME,
      payload,
    );
    return (
      mapPaymentMethodCitizen(raw) ?? {
        id: '',
        citizenId: '',
        paymentMethodId: payload.paymentMethodId,
      }
    );
  },
};

/** @deprecated Prefer `myPaymentMethodCitizenRepository` — kept for existing imports. */
export const paymentMethodCitizenRepository = {
  listMine: () => myPaymentMethodCitizenRepository.listMine(),
  listCatalog: () => myPaymentMethodCitizenRepository.listCatalog(),
  linkMine: (payload: LinkMyPaymentMethodDTO) =>
    myPaymentMethodCitizenRepository.linkMine(payload),
};
