import type { GeolocationCoordinates } from "../entities/Geolocation";

export interface IGeolocationProvider {
  /**
   * Obtiene las coordenadas GPS actuales del usuario
   * @throws Error si la geolocalización no es soportada o el usuario deniega el permiso
   * @returns GeolocationCoordinates con latitude, longitude y accuracy
   */
  getCurrentPosition(): Promise<GeolocationCoordinates>;
}
