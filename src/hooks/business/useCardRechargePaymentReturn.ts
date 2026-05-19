import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCardRechargeStore } from '@/store/business/cardRechargeStore';
import {
  clearCardRechargeReturnTo,
  clearPendingCheckoutSession,
  getPendingStatusPollUrl,
} from '@/lib/card-recharge-return';

interface PaymentReturnState {
  paymentReference?: string;
  statusPollUrl?: string;
  paymentHandled?: boolean;
}

export function useCardRechargePaymentReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const finalizePaymentReturn = useCardRechargeStore(
    (state) => state.finalizePaymentReturn,
  );
  const handledRef = useRef(false);

  useEffect(() => {
    const state = location.state as PaymentReturnState | null;
    const reference = state?.paymentReference?.trim();
    const statusPollUrl =
      state?.statusPollUrl?.trim() || getPendingStatusPollUrl();

    if (state?.paymentHandled || handledRef.current) {
      return;
    }
    if (!reference && !statusPollUrl) {
      return;
    }

    handledRef.current = true;

    void finalizePaymentReturn({ reference, statusPollUrl })
      .catch(() => undefined)
      .finally(() => {
        clearCardRechargeReturnTo();
        clearPendingCheckoutSession();
        navigate(location.pathname + location.search, {
          replace: true,
          state: { paymentHandled: true },
        });
      });
  }, [
    finalizePaymentReturn,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);
}
