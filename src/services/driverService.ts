import { httpMsBussines } from "@/infra/api/builderHttp";

export interface DriverItem {
  id: string;
  name: string;
}

export async function getDrivers(): Promise<DriverItem[]> {
  return httpMsBussines.get<DriverItem[]>("/drivers");
}
