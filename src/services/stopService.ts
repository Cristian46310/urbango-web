import { httpMsBussines } from '@/infra/api/builderHttp';
import { ENDPOINTS } from '@/infra/api/endpoints';
import type { BusinessPage } from '@/core/types/BusinessPage';
import type { Stop } from '@/core/domain/entities/business';

export interface StopItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export async function getStops(): Promise<StopItem[]> {
  const page = await httpMsBussines.get<BusinessPage<Stop>>(ENDPOINTS.STOPS.BASE, {
    params: { page: 1, limit: 100 },
  });
  return page.items
    .map((stop) => {
      const lat = Number(stop.latitude);
      const lng = Number(stop.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: stop.id,
        name: stop.name,
        lat,
        lng,
      };
    })
    .filter((stop): stop is StopItem => stop != null);
}
