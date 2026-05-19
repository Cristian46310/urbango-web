import { httpMsSecurity } from "@/infra/api/builderHttp";

export interface BusItem {
  id: string;
  placa: string;
  capacidad: number;
}

export async function getBuses(): Promise<BusItem[]> {
  return httpMsSecurity.get<BusItem[]>("/buses");
}
