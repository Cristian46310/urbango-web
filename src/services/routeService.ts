import { httpMsBussines } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type { CreateRouteDTO, Route } from "@/core/domain/entities/business";
import type { BusinessPage } from "@/core/types/BusinessPage";

export interface RouteNodePayload {
  order: number;
  stopId: string;
  distanceFromPrevious?: number;
  estimatedTimeMinutes?: number;
}

export interface CreateRoutePayload {
  name: string;
  description: string;
  price: number;
  nodes: RouteNodePayload[];
}

export interface RouteListItem {
  id: string;
  name: string;
}

export async function getRoutes(): Promise<RouteListItem[]> {
  const page = await httpMsBussines.get<BusinessPage<Route>>(ENDPOINTS.ROUTE.BASE, {
    params: { page: 1, limit: 100 },
  });
  return page.items.map((route) => ({
    id: route.id,
    name: route.name,
  }));
}

export async function createRoute(data: CreateRoutePayload): Promise<void> {
  const payload: CreateRouteDTO = {
    name: data.name,
    description: data.description,
    price: data.price,
    nodes: data.nodes.map((node) => ({
      order: node.order,
      stopId: node.stopId,
      estimatedTimeMinutes: node.estimatedTimeMinutes ?? 0,
    })),
  };
  await httpMsBussines.post<void>(ENDPOINTS.ROUTE.BASE, payload);
}
