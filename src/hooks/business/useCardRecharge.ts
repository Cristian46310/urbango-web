import { useCardRechargeStore } from '@/store/business/cardRechargeStore';

export function useCardRecharge() {
  const config = useCardRechargeStore((state) => state.config);
  const cards = useCardRechargeStore((state) => state.cards);
  const preview = useCardRechargeStore((state) => state.preview);
  const lastCheckout = useCardRechargeStore((state) => state.lastCheckout);
  const transactionStatus = useCardRechargeStore((state) => state.transactionStatus);
  const loadingInitial = useCardRechargeStore((state) => state.loadingInitial);
  const loadingPreview = useCardRechargeStore((state) => state.loadingPreview);
  const loadingCheckout = useCardRechargeStore((state) => state.loadingCheckout);
  const loadingStatus = useCardRechargeStore((state) => state.loadingStatus);
  const error = useCardRechargeStore((state) => state.error);
  const loadInitialData = useCardRechargeStore((state) => state.loadInitialData);
  const loadPreview = useCardRechargeStore((state) => state.loadPreview);
  const clearPreview = useCardRechargeStore((state) => state.clearPreview);
  const startCheckout = useCardRechargeStore((state) => state.startCheckout);
  const loadTransactionStatus = useCardRechargeStore((state) => state.loadTransactionStatus);
  const finalizePaymentReturn = useCardRechargeStore((state) => state.finalizePaymentReturn);
  const refreshCards = useCardRechargeStore((state) => state.refreshCards);
  const clearCheckout = useCardRechargeStore((state) => state.clearCheckout);

  return {
    config,
    cards,
    preview,
    lastCheckout,
    transactionStatus,
    loadingInitial,
    loadingPreview,
    loadingCheckout,
    loadingStatus,
    error,
    loadInitialData,
    loadPreview,
    clearPreview,
    startCheckout,
    loadTransactionStatus,
    finalizePaymentReturn,
    refreshCards,
    clearCheckout,
  };
}
