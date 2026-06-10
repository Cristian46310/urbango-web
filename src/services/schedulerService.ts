import { httpMsBussines } from "@/infra/api/builderHttp";

export type RecurrenceType = "none" | "weekdays" | "weekends" | "daily";

export interface CreateSchedulerPayload {
  routeId: string;
  busId: string;
  date: string;
  startTime: string;
  endTime: string;
  toleranceMinutes: number;
  recurrenceType: RecurrenceType;
}

export async function createScheduler(data: CreateSchedulerPayload): Promise<void> {
  await httpMsBussines.post<void>("/schedulers", data);
}
