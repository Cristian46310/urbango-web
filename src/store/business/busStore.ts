import { create } from 'zustand';
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from '@/lib/toast';
import type { Bus, CreateBusDTO } from '@/core/domain/entities/business/Bus';
import { PostBusUseCase } from '@/core/applications/business/bus/postBusUseCase';
import { UploadBusPhotoUseCase } from '@/core/applications/business/bus/uploadBusPhotoUseCase';
import { BusRepository } from '@/infra/repository/business/BusRepository';
import { getApiErrorMessage } from '@/lib/api-error';

const busRepository = new BusRepository();
const postBusUseCase = new PostBusUseCase(busRepository);
const uploadBusPhotoUseCase = new UploadBusPhotoUseCase(busRepository);

interface BusStoreState {
  loading: boolean;
  error: string | null;
  lastRegisteredBus: Bus | null;
  registerBus: (data: CreateBusDTO, photo?: File | null) => Promise<Bus>;
  clearLastRegisteredBus: () => void;
}

export const useBusStore = create<BusStoreState>((set) => ({
  loading: false,
  error: null,
  lastRegisteredBus: null,
  clearLastRegisteredBus: () => {
    set({ lastRegisteredBus: null, error: null });
  },
  registerBus: async (data, photo) => {
    const loadingToastId = showLoadingToast('Registrando bus en la flota...');
    set({ loading: true, error: null });

    try {
      let bus = await postBusUseCase.execute(data);

      if (photo) {
        bus = await uploadBusPhotoUseCase.execute(bus.id, photo);
      }

      set({ loading: false, lastRegisteredBus: bus });
      showSuccessToast('Bus registrado correctamente en tu flota');
      return bus;
    } catch (error) {
      const message = getApiErrorMessage(error, 'No se pudo registrar el bus');
      set({ loading: false, error: message });
      showErrorToast(message);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
