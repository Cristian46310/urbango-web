import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

import type { UserAlert } from "@/core/types/alerts";

const AUTH_TOKEN_STORAGE_KEY = "authToken";

function normalizeAlert(raw: unknown): UserAlert | null {
  if (!raw || typeof raw !== "object") return null;

  const source = raw as Record<string, unknown>;
  const id = typeof source.id === "string" ? source.id : "";
  const title = typeof source.title === "string" ? source.title : "";
  const body = typeof source.body === "string" ? source.body : "";

  if (!id || !title) return null;

  return {
    id,
    title,
    body,
    isUrgent: Boolean(source.isUrgent),
    scope: (source.scope as UserAlert["scope"]) ?? "all",
    senderId: typeof source.senderId === "string" ? source.senderId : "",
    senderName: typeof source.senderName === "string" ? source.senderName : undefined,
    sentAt: typeof source.sentAt === "string" ? source.sentAt : new Date().toISOString(),
    isRead: Boolean(source.isRead),
    canReply: false,
  };
}

interface UseAlertsSocketOptions {
  enabled?: boolean;
  onUrgentAlert?: (alert: UserAlert) => void;
  onNewAlert?: (alert: UserAlert) => void;
}

export function useAlertsSocket({
  enabled = true,
  onUrgentAlert,
  onNewAlert,
}: UseAlertsSocketOptions) {
  const onUrgentAlertRef = useRef(onUrgentAlert);
  const onNewAlertRef = useRef(onNewAlert);

  useEffect(() => {
    onUrgentAlertRef.current = onUrgentAlert;
  }, [onUrgentAlert]);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return;

    const baseUrl = import.meta.env.VITE_URL_MS_MESSAGES as string;
    const socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("alert:push", (payload: unknown) => {
      const alert = normalizeAlert(payload);
      if (!alert) return;
      onUrgentAlertRef.current?.(alert);
    });

    socket.on("alert:new", (payload: unknown) => {
      const alert = normalizeAlert(payload);
      if (!alert) return;
      onNewAlertRef.current?.(alert);
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled]);
}
