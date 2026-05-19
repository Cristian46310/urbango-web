import type { IGeolocationProvider } from "@/core/domain/interfaces/IGeolocationProvider";
import type { GeolocationCoordinates } from "@/core/domain/entities/Geolocation";

export class BrowserGeolocationProvider implements IGeolocationProvider {
  async getCurrentPosition(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("La geolocalización no es soportada en tu navegador"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({
            latitude,
            longitude,
            accuracy,
          });
        },
        (err) => {
          let errorMessage = "Error al obtener la ubicación";

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage =
                "Permiso denegado. Por favor, habilita la geolocalización en tu navegador.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Información de ubicación no disponible";
              break;
            case err.TIMEOUT:
              errorMessage = "Tiempo de espera agotado al obtener la ubicación";
              break;
            default:
              errorMessage = err.message;
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }
}
