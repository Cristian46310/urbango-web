import { useBusStore } from '@/store/business/busStore';

export function useBus() {
  const loading = useBusStore((state) => state.loading);
  const error = useBusStore((state) => state.error);
  const lastRegisteredBus = useBusStore((state) => state.lastRegisteredBus);
  const registerBus = useBusStore((state) => state.registerBus);
  const clearLastRegisteredBus = useBusStore((state) => state.clearLastRegisteredBus);

  return {
    loading,
    error,
    lastRegisteredBus,
    registerBus,
    clearLastRegisteredBus,
  };
}
