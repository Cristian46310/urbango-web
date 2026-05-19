import { httpMsSecurity } from "@/infra/api/builderHttp";

export interface StartTurnPayload {
  busStatus: string;
  observations?: string;
}

export interface StartTurnResponse {
  busAssigned?: string;
  startTime?: string;
  status?: string;
}

export async function startTurn(payload: StartTurnPayload): Promise<StartTurnResponse> {
  return httpMsSecurity.post<StartTurnResponse>("/turn/start", payload);
}
