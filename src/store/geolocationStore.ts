import { create } from "zustand";
import { toast } from "sonner";
import type { GeolocationCoordinates } from "@/core/domain/entities/Geolocation";
import { GetUserGeolocation } from "@/app/cases/geolocation/GetUserGeolocation";
import { BrowserGeolocationProvider } from "@/infra/geolocation/BrowserGeolocationProvider";

interface GeolocationState {
  coordinates: GeolocationCoordinates | null;
  loading: boolean;
  error: string | null;
  requestGeolocation: () => Promise<void>;
  reset: () => void;
}

const geolocationProvider = new BrowserGeolocationProvider();
const getUserGeolocation = new GetUserGeolocation(geolocationProvider);

export const useGeolocationStore = create<GeolocationState>((set) => ({
  coordinates: null,
  loading: false,
  error: null,

  requestGeolocation: async () => {
    set({ loading: true, error: null });

    try {
      const coordinates = await getUserGeolocation.execute();
      set({ coordinates, loading: false });
      toast.success("Ubicación detectada correctamente");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al obtener la ubicación";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  reset: () => {
    set({ coordinates: null, loading: false, error: null });
  },
}));
