import { create } from 'zustand';
import type {
  CardRechargeCheckoutResult,
  CardRechargeConfig,
  CardRechargePreview,
  CardRechargeTransactionStatus,
  RechargeableCard,
} from '@/core/domain/entities/business/CardRecharge';
import { isTerminalPaymentStatus, sleep } from '@/lib/card-recharge-payment';
import { cardRechargeRepository } from '@/infra/repository/cardRecharge';
import { getApiErrorMessage } from '@/lib/api-error';
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from '@/lib/toast';

const STATUS_POLL_ATTEMPTS = 8;
const STATUS_POLL_INTERVAL_MS = 1500;

interface FinalizePaymentReturnInput {
  reference?: string;
  statusPollUrl?: string;
}

interface CardRechargeStoreState {
  config: CardRechargeConfig | null;
  cards: RechargeableCard[];
  preview: CardRechargePreview | null;
  lastCheckout: CardRechargeCheckoutResult | null;
  transactionStatus: CardRechargeTransactionStatus | null;
  loadingInitial: boolean;
  loadingPreview: boolean;
  loadingCheckout: boolean;
  loadingStatus: boolean;
  error: string | null;
  loadInitialData: (options?: { silent?: boolean }) => Promise<void>;
  refreshCards: () => Promise<RechargeableCard[]>;
  loadPreview: (paymentMethodCitizenId: string, amount: number) => Promise<void>;
  clearPreview: () => void;
  startCheckout: (
    paymentMethodCitizenId: string,
    amount: number,
    responseUrl: string,
  ) => Promise<CardRechargeCheckoutResult>;
  loadTransactionStatus: (reference: string) => Promise<CardRechargeTransactionStatus>;
  finalizePaymentReturn: (
    input: FinalizePaymentReturnInput,
  ) => Promise<CardRechargeTransactionStatus | null>;
  clearCheckout: () => void;
}

async function fetchTransactionStatus(
  input: FinalizePaymentReturnInput,
): Promise<CardRechargeTransactionStatus> {
  if (input.statusPollUrl?.trim()) {
    return cardRechargeRepository.getTransactionStatusByPollUrl(input.statusPollUrl);
  }
  if (input.reference?.trim()) {
    return cardRechargeRepository.getTransactionStatus(input.reference);
  }
  throw new Error('No hay referencia de pago para consultar el estado');
}

export const useCardRechargeStore = create<CardRechargeStoreState>((set, get) => ({
  config: null,
  cards: [],
  preview: null,
  lastCheckout: null,
  transactionStatus: null,
  loadingInitial: false,
  loadingPreview: false,
  loadingCheckout: false,
  loadingStatus: false,
  error: null,

  loadInitialData: async (options) => {
    if (get().loadingInitial) {
      return;
    }

    const silent = options?.silent ?? false;
    const loadingToastId = silent
      ? null
      : showLoadingToast('Cargando tarjetas y configuración...');
    set({ loadingInitial: true, error: null });

    try {
      const [config, cards] = await Promise.all([
        cardRechargeRepository.getConfig(),
        cardRechargeRepository.listCards(),
      ]);
      set({ config, cards, loadingInitial: false });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No se pudo cargar la información de recarga',
      );
      set({ loadingInitial: false, error: message });
      if (!silent) {
        showErrorToast(message);
      }
      throw error;
    } finally {
      if (loadingToastId) {
        dismissToast(loadingToastId);
      }
    }
  },

  refreshCards: async () => {
    const cards = await cardRechargeRepository.listCards();
    set({ cards });
    return cards;
  },

  loadPreview: async (paymentMethodCitizenId, amount) => {
    set({ loadingPreview: true, error: null });

    try {
      const preview = await cardRechargeRepository.preview({
        paymentMethodCitizenId,
        amount,
      });
      set({ preview, loadingPreview: false });
    } catch (error) {
      const message = getApiErrorMessage(error, 'No se pudo calcular la vista previa');
      set({ preview: null, loadingPreview: false, error: message });
      showErrorToast(message);
      throw error;
    }
  },

  clearPreview: () => {
    set({ preview: null });
  },

  startCheckout: async (paymentMethodCitizenId, amount, responseUrl) => {
    const loadingToastId = showLoadingToast('Preparando pago con ePayco...');
    set({ loadingCheckout: true, error: null });

    try {
      const checkout = await cardRechargeRepository.checkout({
        paymentMethodCitizenId,
        amount,
        responseUrl,
      });
      set({ lastCheckout: checkout, loadingCheckout: false });
      return checkout;
    } catch (error) {
      const message = getApiErrorMessage(error, 'No se pudo iniciar el pago');
      set({ loadingCheckout: false, error: message });
      showErrorToast(message);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },

  loadTransactionStatus: async (reference) => {
    set({ loadingStatus: true, error: null });

    try {
      const transactionStatus = await cardRechargeRepository.getTransactionStatus(reference);
      set({ transactionStatus, loadingStatus: false });
      return transactionStatus;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No se pudo consultar el estado de la recarga',
      );
      set({ loadingStatus: false, error: message });
      showErrorToast(message);
      throw error;
    }
  },

  finalizePaymentReturn: async (input) => {
    if (!input.statusPollUrl?.trim() && !input.reference?.trim()) {
      await get().refreshCards();
      return null;
    }

    set({ loadingStatus: true, error: null });

    try {
      let transactionStatus = await fetchTransactionStatus(input);

      for (let attempt = 0; attempt < STATUS_POLL_ATTEMPTS; attempt += 1) {
        if (isTerminalPaymentStatus(transactionStatus.status)) {
          break;
        }
        if (attempt < STATUS_POLL_ATTEMPTS - 1) {
          await sleep(STATUS_POLL_INTERVAL_MS);
          transactionStatus = await fetchTransactionStatus(input);
        }
      }

      const cards = await cardRechargeRepository.listCards();
      set({ transactionStatus, cards, loadingStatus: false, preview: null });

      const normalized = transactionStatus.status.toLowerCase();
      if (normalized === 'approved' || normalized === 'aceptada' || normalized === 'accepted') {
        showSuccessToast('Recarga aplicada. Saldo actualizado.');
      } else if (normalized === 'pending' || normalized === 'pendiente') {
        showSuccessToast('Pago recibido. El saldo se actualizará en breve.');
      } else {
        showErrorToast('El pago no fue aprobado. Revisa el estado de la transacción.');
      }

      return transactionStatus;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No se pudo confirmar la recarga',
      );
      set({ loadingStatus: false, error: message });
      showErrorToast(message);
      try {
        await get().refreshCards();
      } catch {
        // ignore secondary failure
      }
      throw error;
    }
  },

  clearCheckout: () => {
    set({ lastCheckout: null, transactionStatus: null, preview: null });
  },
}));
