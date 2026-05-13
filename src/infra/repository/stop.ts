import { httpMsBussines } from '../api/builderHttp';
import { ENDPOINTS } from '../api/endpoints';
import type { NearbyStopDto } from '@/core/types/Stop';

export const stopRepository = {
  async findNearbyStops(
    latitude: number,
    longitude: number,
    limit: number = 5,
    radiusMeters: number = 1000
  ): Promise<NearbyStopDto[]> {
    try {
      const response = await httpMsBussines.get<NearbyStopDto[]>(
        ENDPOINTS.STOPS.NEARBY,
        {
          params: {
            lat: latitude,
            lon: longitude,
            limit,
            radiusMeters,
          },
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
};
