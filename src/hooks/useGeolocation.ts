import { useState } from 'react';
import { toast } from 'sonner';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface UseGeolocationReturn {
  coordinates: GeolocationCoordinates | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = () => {
    if (!navigator.geolocation) {
      const errorMsg = 'La geolocalización no es soportada en tu navegador';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords: GeolocationCoordinates = {
          latitude,
          longitude,
          accuracy,
        };
        setCoordinates(coords);
        setLoading(false);
        toast.success('Ubicación detectada correctamente');
      },
      (err) => {
        let errorMsg = 'Error al obtener la ubicación';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Permiso denegado. Por favor, habilita la geolocalización en tu navegador.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Información de ubicación no disponible';
            break;
          case err.TIMEOUT:
            errorMsg = 'Tiempo de espera agotado al obtener la ubicación';
            break;
          default:
            errorMsg = err.message;
        }
        
        setError(errorMsg);
        setLoading(false);
        toast.error(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return {
    coordinates,
    loading,
    error,
    requestPermission,
  };
};
