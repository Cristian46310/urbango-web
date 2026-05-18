import { useGeolocationStore } from "@/store/geolocationStore";
import type { GeolocationCoordinates } from "@/core/domain/entities/Geolocation";

export interface UseGeolocationReturn {
  coordinates: GeolocationCoordinates | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
}

/**
 * Custom hook que expone el estado global de geolocalización
 * Utiliza el store centralizado que maneja toda la lógica
 *
 * @returns {UseGeolocationReturn} Estado de ubicación y función para solicitarla
 */
export const useGeolocation = (): UseGeolocationReturn => {
  const { coordinates, loading, error, requestGeolocation } =
    useGeolocationStore();

  return {
    coordinates,
    loading,
    error,
    requestPermission: requestGeolocation,
  };
};
