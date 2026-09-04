import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

import type { UserAlert } from "@/core/types/alerts";
import { useAuthStore } from "@/store/security/authStore";

const AUTH_TOKEN_STORAGE_KEY = "authToken";
const MESSAGES_NAMESPACE = "/messages";
const MESSAGES_WS_PATH = "/messages/ws";

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

function isUnauthorizedPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : "";
  return code.toUpperCase() === "UNAUTHORIZED";
}

interface UseAlertsSocketOptions {
  enabled?: boolean;
  onUrgentAlert?: (alert: UserAlert) => void;
  onNewAlert?: (alert: UserAlert) => void;
  onUnauthorized?: () => void;
}

export function useAlertsSocket({
  enabled = true,
  onUrgentAlert,
  onNewAlert,
  onUnauthorized,
}: UseAlertsSocketOptions) {
  const onUrgentAlertRef = useRef(onUrgentAlert);
  const onNewAlertRef = useRef(onNewAlert);
  const onUnauthorizedRef = useRef(onUnauthorized);
  const unauthorizedHandledRef = useRef(false);

  useEffect(() => {
    onUrgentAlertRef.current = onUrgentAlert;
  }, [onUrgentAlert]);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return;

    const baseUrl = (import.meta.env.VITE_URL_MS_MESSAGES as string | undefined)?.replace(/\/+$/, "");
    if (!baseUrl) return;

    unauthorizedHandledRef.current = false;

    const socket = io(`${baseUrl}${MESSAGES_NAMESPACE}`, {
      path: MESSAGES_WS_PATH,
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
    });

    const handleUnauthorized = () => {
      if (unauthorizedHandledRef.current) return;
      unauthorizedHandledRef.current = true;
      socket.io.opts.reconnection = false;
      socket.disconnect();
      onUnauthorizedRef.current?.();
      useAuthStore.getState().logout();
    };

    socket.on("error", (payload: unknown) => {
      if (isUnauthorizedPayload(payload)) {
        handleUnauthorized();
      }
    });

    socket.on("connect_error", (err: Error) => {
      const message = err.message.toLowerCase();
      if (message.includes("unauthorized") || message.includes("jwt") || message.includes("token")) {
        handleUnauthorized();
      }
    });

    socket.on("alert:push", (payload: unknown) => {
      const alert = normalizeAlert(payload);
      if (!alert) return;
      onUrgentAlertRef.current?.({ ...alert, isUrgent: true });
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
