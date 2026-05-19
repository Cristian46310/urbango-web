import { httpMsSecurity } from "@/infra/api/builderHttp";

export interface StopItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export async function getStops(): Promise<StopItem[]> {
  return httpMsSecurity.get<StopItem[]>("/stops");
}
