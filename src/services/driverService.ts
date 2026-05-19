import { httpMsSecurity } from "@/infra/api/builderHttp";

export interface DriverItem {
  id: string;
  name: string;
}

export async function getDrivers(): Promise<DriverItem[]> {
  return httpMsSecurity.get<DriverItem[]>("/drivers");
}
