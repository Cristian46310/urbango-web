import { httpMsMessages } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  AlertsPage,
  AlertsQuery,
  AlertsUnreadCount,
  MassAlert,
  MassAlertPayload,
  MassAlertPreview,
  MassAlertStats,
  MassAlertsPage,
  UserAlert,
} from "@/core/types/alerts";
import type { BusinessPageableQuery } from "@/core/types/BusinessPage";

export async function getAlerts(query: AlertsQuery = { page: 1, limit: 20 }): Promise<AlertsPage> {
  return httpMsMessages.get<AlertsPage>(ENDPOINTS.ALERTS.BASE, { params: query });
}

export async function getAlertsUnreadCount(): Promise<AlertsUnreadCount> {
  const response = await httpMsMessages.get<AlertsUnreadCount | { unreadCount: number }>(
    ENDPOINTS.ALERTS.UNREAD_COUNT,
  );

  if ("count" in response && typeof response.count === "number") {
    return { count: response.count };
  }

  if ("unreadCount" in response && typeof response.unreadCount === "number") {
    return { count: response.unreadCount };
  }

  return { count: 0 };
}

export async function getAlertById(alertId: string): Promise<UserAlert> {
  return httpMsMessages.get<UserAlert>(ENDPOINTS.ALERTS.BY_ID(alertId));
}

export async function markAlertAsRead(alertId: string): Promise<UserAlert> {
  return httpMsMessages.patch<UserAlert>(ENDPOINTS.ALERTS.READ(alertId));
}

export async function previewMassAlertRecipients(
  payload: MassAlertPayload,
): Promise<MassAlertPreview> {
  return httpMsMessages.post<MassAlertPreview>(ENDPOINTS.MASS_ALERTS.PREVIEW, payload);
}

export async function createMassAlert(payload: MassAlertPayload): Promise<MassAlert> {
  return httpMsMessages.post<MassAlert>(ENDPOINTS.MASS_ALERTS.BASE, payload);
}

export async function getMassAlerts(
  query: BusinessPageableQuery = { page: 1, limit: 10 },
): Promise<MassAlertsPage> {
  return httpMsMessages.get<MassAlertsPage>(ENDPOINTS.MASS_ALERTS.BASE, { params: query });
}

export async function getMassAlertById(alertId: string): Promise<MassAlert> {
  return httpMsMessages.get<MassAlert>(ENDPOINTS.MASS_ALERTS.BY_ID(alertId));
}

export async function getMassAlertStats(alertId: string): Promise<MassAlertStats> {
  return httpMsMessages.get<MassAlertStats>(ENDPOINTS.MASS_ALERTS.STATS(alertId));
}
