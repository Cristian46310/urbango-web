import { httpMsBussines } from '../api/builderHttp';
import { ENDPOINTS } from '../api/endpoints';
import type { NearbyStopDto, Route } from '@/core/domain/entities/Stop';

type NearbyStopApiDto = {
  id: string;
  name: string;
  location?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  distance?: number;
  routes?: Array<{ id: string; name: string; code?: string }>;
};

type PaginatedStopsResponse = {
  items?: NearbyStopApiDto[];
};

function toNearbyStopList(data: unknown): NearbyStopDto[] {
  if (Array.isArray(data)) {
    return data.map(mapNearbyStop);
  }

  if (data && typeof data === 'object' && Array.isArray((data as PaginatedStopsResponse).items)) {
    return (data as PaginatedStopsResponse).items!.map(mapNearbyStop);
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
    limit: number = 5,
    radiusMeters: number = 1000
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
