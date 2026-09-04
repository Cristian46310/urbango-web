import { myPaymentMethodCitizenRepository } from '@/infra/repository/paymentMethodCitizen';
import type { PaymentMethodCode } from '@/core/domain/entities/business';

export interface PaymentMethodItem {
  /** paymentMethodCitizenId — send this on boarding. */
  id: string;
  paymentMethodId: string;
  balance: number;
  type: string;
  code?: PaymentMethodCode;
  isRechargeable?: boolean;
}

/**
 * Boarding must use linked methods from GET /payment-method-citizen/me,
 * not the general payment-method catalog.
 */
export async function getMyPaymentMethods(): Promise<PaymentMethodItem[]> {
  const mine = await myPaymentMethodCitizenRepository.listMine();
  return mine.map((item) => ({
    id: item.id,
    paymentMethodId: item.paymentMethodId,
    balance: item.balance,
    type: item.label,
    code: item.code,
    isRechargeable: item.isRechargeable,
  }));
}
