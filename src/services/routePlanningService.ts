import type {
  BoardingRouteStops,
  RouteDetail,
  RouteListItem,
} from '@/core/domain/entities/business/Transit';
import type { BusinessPage } from '@/core/types/BusinessPage';
import { transitRepository } from '@/infra/repository/transit';

export type { RouteDetail, RouteListItem };

export async function listRoutes(name?: string): Promise<BusinessPage<RouteListItem>> {
  return transitRepository.listRoutes({ page: 1, limit: 50, name });
}

export async function getRouteById(id: string): Promise<RouteDetail> {
  return transitRepository.getRouteById(id);
}

export async function getBoardingStopsForBus(busId: string): Promise<BoardingRouteStops> {
  return transitRepository.getBoardingStopsForBus(busId);
}

export { totalRouteMinutes, orderedRouteStops } from '@/infra/repository/transit';
