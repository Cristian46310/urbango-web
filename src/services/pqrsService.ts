import { httpMsAi } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  Pqrs,
  PqrsUpdate,
  CreatePqrsRequest,
  UpdatePqrsRequest,
  CreatePqrsUpdateRequest,
  ListPqrsQuery,
} from "@/core/types/pqrs";

export async function createPqrs(payload: CreatePqrsRequest): Promise<Pqrs> {
  return httpMsAi.post<Pqrs>(ENDPOINTS.PQRS.BASE, payload);
}

export async function listPqrs(query?: ListPqrsQuery): Promise<Pqrs[]> {
  return httpMsAi.get<Pqrs[]>(ENDPOINTS.PQRS.BASE, { params: query });
}

export async function getPqrsByTicket(ticketNumber: string): Promise<Pqrs> {
  return httpMsAi.get<Pqrs>(ENDPOINTS.PQRS.BY_TICKET(ticketNumber));
}

export async function getPqrs(pqrsId: string): Promise<Pqrs> {
  return httpMsAi.get<Pqrs>(ENDPOINTS.PQRS.BY_ID(pqrsId));
}

export async function updatePqrs(
  pqrsId: string,
  payload: UpdatePqrsRequest,
): Promise<Pqrs> {
  return httpMsAi.put<Pqrs>(ENDPOINTS.PQRS.BY_ID(pqrsId), payload);
}

export async function deletePqrs(pqrsId: string): Promise<void> {
  return httpMsAi.delete<void>(ENDPOINTS.PQRS.BY_ID(pqrsId));
}

export async function createPqrsUpdate(
  pqrsId: string,
  payload: CreatePqrsUpdateRequest,
): Promise<PqrsUpdate> {
  return httpMsAi.post<PqrsUpdate>(ENDPOINTS.PQRS.UPDATES(pqrsId), payload);
}

export async function listPqrsUpdates(pqrsId: string): Promise<PqrsUpdate[]> {
  return httpMsAi.get<PqrsUpdate[]>(ENDPOINTS.PQRS.UPDATES(pqrsId));
}

export async function getPqrsUpdate(
  pqrsId: string,
  updateId: string,
): Promise<PqrsUpdate> {
  return httpMsAi.get<PqrsUpdate>(ENDPOINTS.PQRS.UPDATE_BY_ID(pqrsId, updateId));
}
