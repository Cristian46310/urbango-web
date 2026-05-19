import { useGeolocationStore } from "@/store/geolocationStore";
import type { GeolocationCoordinates } from "@/core/domain/entities/Geolocation";

export interface UseGeolocationReturn {
  coordinates: GeolocationCoordinates | null;
  latitude: number | null;
  longitude: number | null;
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
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    loading,
    error,
    requestPermission: requestGeolocation,
  };
};
