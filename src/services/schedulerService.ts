import { httpMsBussines } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";

export type RecurrenceType = "none" | "weekdays" | "weekends" | "daily";

/** Body for POST /scheduler — no `status` (backend sets programado). */
export interface CreateSchedulerPayload {
  busId: string;
  routeId: string;
  date: string;
  departureTime: string;
  toleranceMinutes?: number;
  recurrenceType?: RecurrenceType;
}

export async function createScheduler(data: CreateSchedulerPayload): Promise<void> {
  await httpMsBussines.post<void>(ENDPOINTS.SCHEDULER.BASE, data);
}
