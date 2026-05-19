import { httpMsSecurity } from "@/infra/api/builderHttp";

export interface RouteNodePayload {
  stopId: string;
  order: number;
  distanceFromPrevious: number;
  estimatedTimeMinutes: number;
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
  return httpMsSecurity.get<RouteListItem[]>("/routes");
}

export async function createRoute(data: CreateRoutePayload): Promise<void> {
  await httpMsSecurity.post<void>("/routes", data);
}
