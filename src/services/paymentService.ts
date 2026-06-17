import { paymentMethodCitizenRepository } from '@/infra/repository/paymentMethodCitizen';
import { cardRechargeRepository } from '@/infra/repository/cardRecharge';
import type { RechargeableCard } from '@/core/domain/entities/business/CardRecharge';

export interface PaymentMethodItem {
  id: string;
  balance: number;
  type: string;
}

export async function getMyPaymentMethods(): Promise<PaymentMethodItem[]> {
  try {
    const mine = await paymentMethodCitizenRepository.listMine();
    if (mine.length > 0) {
      return mine.map((item) => ({
        id: item.id,
        balance: item.balance,
        type: item.label,
      }));
    }
  } catch {
    // Fallback si el backend aún no expone GET /payment-method-citizen/me
  }

  const cards = await cardRechargeRepository.listCards();
  return cards.map(mapCardToPaymentMethod);
}

function mapCardToPaymentMethod(card: RechargeableCard): PaymentMethodItem {
  return {
    id: card.id,
    balance: card.balance ?? 0,
    type: card.label,
  };
}
