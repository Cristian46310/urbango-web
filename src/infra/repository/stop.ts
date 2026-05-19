import { httpMsBussines } from '../api/builderHttp';
import { ENDPOINTS } from '../api/endpoints';
import type { NearbyStopDto, Route } from '@/core/domain/entities/Stop';

interface NearbyStopApiDto {
  id: string;
  name: string;
  location?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  distance?: number;
  routes?: { id: string; name: string; code?: string }[];
}

interface PaginatedStopsResponse {
  items?: NearbyStopApiDto[];
}

function toNearbyStopList(data: unknown): NearbyStopDto[] {
  if (Array.isArray(data)) {
    return data.map(mapNearbyStop);
  }

  if (data && typeof data === 'object') {
    const items = (data as PaginatedStopsResponse).items;
    if (Array.isArray(items)) {
      return items.map(mapNearbyStop);
    }
  }

  return [];
}

function mapNearbyStop(stop: NearbyStopApiDto): NearbyStopDto {
  return {
    id: stop.id,
    name: stop.name,
    latitude: stop.latitude,
    longitude: stop.longitude,
    distance: stop.distanceMeters ?? stop.distance ?? 0,
    routes: (stop.routes ?? []).map(
      (route): Route => ({
        id: route.id,
        name: route.name,
        code: route.code ?? route.name,
      })
    ),
  };
}

export const stopRepository = {
  async findNearbyStops(
    latitude: number,
    longitude: number,
    limit = 5,
    radiusMeters = 1000
  ): Promise<NearbyStopDto[]> {
    const response = await httpMsBussines.get<unknown>(ENDPOINTS.STOPS.NEARBY, {
      params: {
        lat: latitude,
        lon: longitude,
        limit,
        radiusMeters,
      },
    });

    return toNearbyStopList(response);
  },
};
