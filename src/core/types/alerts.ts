import type { BusinessPage, BusinessPageableQuery } from "./BusinessPage";

export type AlertScope = "all" | "route" | "zone";

export type MassAlertStatus = "scheduled" | "sent";

export interface MassAlertPayload {
  title: string;
  body: string;
  scope: AlertScope;
  routeIds?: string[];
  zoneNames?: string[];
  isUrgent?: boolean;
  scheduledAt?: string;
}

export interface MassAlertPreview extends MassAlertPayload {
  count: number;
}

export interface MassAlert {
  id: string;
  senderId: string;
  title: string;
  body: string;
  scope: AlertScope;
  routeIds?: string[];
  zoneNames?: string[];
  isUrgent: boolean;
  status: MassAlertStatus;
  recipientCount: number;
  scheduledAt?: string;
  createdAt: string;
  sentAt?: string;
}

export interface MassAlertStats {
  alertId: string;
  totalRecipients: number;
  deliveredCount: number;
  readCount: number;
  unreadCount: number;
  readPercentage: number;
}

export interface UserAlert {
  id: string;
  title: string;
  body: string;
  isUrgent: boolean;
  scope: AlertScope;
  senderId: string;
  senderName?: string;
  sentAt: string;
  isRead: boolean;
  canReply: false;
}

export interface AlertsUnreadCount {
  count: number;
}

export type AlertsPage = BusinessPage<UserAlert>;
export type MassAlertsPage = BusinessPage<MassAlert>;

export interface AlertsQuery extends BusinessPageableQuery {
  unreadOnly?: boolean;
}
