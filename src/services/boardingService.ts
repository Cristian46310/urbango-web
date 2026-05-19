import { httpMsSecurity } from "@/infra/api/builderHttp";

export interface BoardingPayload {
  busId: string;
  paymentMethodCitizenId: string;
  nodeId: string;
}

export interface BoardingResponse {
  remainingBalance?: number;
  message?: string;
}

export async function board(payload: BoardingPayload): Promise<BoardingResponse> {
  return httpMsSecurity.post<BoardingResponse>("/boarding", payload);
}
