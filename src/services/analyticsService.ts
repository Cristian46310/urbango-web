import { httpMsBussines } from "@/infra/api/builderHttp";

export interface AgeDistributionParams {
  routeId: string;
  startDate: string;
  endDate: string;
}

export interface AgeDistributionSegment {
  range: string;
  count: number;
  percentage: number;
  variation: string;
}

export interface AgeDistributionResponse {
  segments: AgeDistributionSegment[];
  totalPassengers: number;
  dominantSegment: string;
}

export async function getAgeDistribution(params: AgeDistributionParams): Promise<AgeDistributionResponse> {
  return httpMsBussines.get<AgeDistributionResponse>("/analytics/passengers/age-distribution", {
    params,
  });
}

export async function exportAgeDistributionExcel(params: AgeDistributionParams): Promise<Blob> {
  return httpMsBussines.get<Blob>(
    "/analytics/passengers/age-distribution/export/excel",
    {
      params,
      responseType: "blob",
    }
  );
}
