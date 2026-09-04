import { httpMsBussines } from "@/infra/api/builderHttp";

export interface AgeDistributionParams {
  routeId?: string;
  startDate: string;
  endDate: string;
}

export interface AgeDistributionSegment {
  range: string;
  count: number;
  percentage: number;
  variation?: string;
}

export interface AgeDistributionResponse {
  segments: AgeDistributionSegment[];
  totalPassengers: number;
  dominantSegment: string;
}

function buildAgeDistributionParams(params: AgeDistributionParams): AgeDistributionParams {
  return {
    ...(params.routeId?.trim() ? { routeId: params.routeId } : {}),
    startDate: params.startDate,
    endDate: params.endDate,
  };
}

export async function getAgeDistribution(params: AgeDistributionParams): Promise<AgeDistributionResponse> {
  return httpMsBussines.get<AgeDistributionResponse>("/dashboard/passengers/age-distribution", {
    params: buildAgeDistributionParams(params),
  });
}

export async function exportAgeDistributionExcel(params: AgeDistributionParams): Promise<Blob> {
  return httpMsBussines.get<Blob>(
    "/dashboard/passengers/age-distribution/export/excel",
    {
      params: buildAgeDistributionParams(params),
      responseType: "blob",
    }
  );
}
