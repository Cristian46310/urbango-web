export interface CardRechargeConfig {
  predefinedAmounts: number[];
  minAmount: number;
  maxAmount: number;
  commissionRate?: number;
  commissionFixed?: number;
  epaycoTestMode?: boolean;
  currency?: string;
}

export interface RechargeableCard {
  id: string;
  label: string;
  balance: number;
  cardNumber?: string;
}

export interface CardRechargePreview {
  currentBalance: number;
  balanceAfterRecharge: number;
  rechargeAmount: number;
  commission: number;
  totalToPay: number;
  commissionApplies: boolean;
  commissionLabel?: string;
}

export interface CardRechargeCheckoutResult {
  sessionId: string;
  reference: string;
  /** Ruta relativa, ej. /card-recharge/transactions/RC-xxx/status */
  statusPollUrl: string;
  description?: string;
  amount: number;
  test?: boolean;
}

export type CardRechargeTransactionState =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'failed'
  | 'cancelled'
  | string;

export interface CardRechargeTransactionStatus {
  reference: string;
  status: CardRechargeTransactionState;
  rechargeAmount?: number;
  totalPaid?: number;
  commission?: number;
  cardLabel?: string;
  message?: string;
  balanceAfter?: number;
}

export interface PreviewCardRechargePayload {
  paymentMethodCitizenId: string;
  amount: number;
}

export interface CardRechargeCheckoutPayload {
  paymentMethodCitizenId: string;
  amount: number;
  responseUrl: string;
}
