import type { GeolocationCoordinates } from "@/core/domain/entities/Geolocation";
import type { IGeolocationProvider } from "@/core/domain/interfaces/IGeolocationProvider";

export class GetUserGeolocation {
  private geolocationProvider: IGeolocationProvider;

  constructor(geolocationProvider: IGeolocationProvider) {
    this.geolocationProvider = geolocationProvider;
  }

  async execute(): Promise<GeolocationCoordinates> {
    try {
      const coordinates = await this.geolocationProvider.getCurrentPosition();
      return coordinates;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      throw new Error(message);
    }
  }
}
