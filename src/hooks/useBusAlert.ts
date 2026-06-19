import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { buildRealtimeSocketConfig } from "@/infra/api/realtimeSocket";
import { dashboardRepository } from "@/infra/repository/business/DashboardRepository";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  ArrivalNotificationPayload,
  CreateArrivalNotificationDTO,
} from "@/core/domain/entities/business";

export interface BusPosition {
  busId: string;
  plate?: string;
  lat: number;
  lng: number;
  etaMinutes?: number;
  estimatedMinutesToWaitingStop?: number;
  occupancyPercent?: number;
  isFull?: boolean;
}

export interface AlertActivationState {
  loading: boolean;
  active: boolean;
  subscribed: boolean;
  sent: boolean;
  scheduled: boolean;
  etaMinutes: number | null;
  stopName: string | null;
  error: string | null;
}

const INITIAL_ALERT_STATE: AlertActivationState = {
  loading: false,
  active: false,
  subscribed: false,
  sent: false,
  scheduled: false,
  etaMinutes: null,
  stopName: null,
  error: null,
};

export function useBusAlert({
  userEmail,
  onArrival,
}: {
  userEmail?: string;
  onArrival?: (payload: ArrivalNotificationPayload) => void;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [alertState, setAlertState] = useState<AlertActivationState>(INITIAL_ALERT_STATE);
  const [trackedBus, setTrackedBus] = useState<BusPosition | null>(null);

  const emailRef = useRef(userEmail);
  useEffect(() => { emailRef.current = userEmail; }, [userEmail]);

  const onArrivalRef = useRef(onArrival);
  useEffect(() => { onArrivalRef.current = onArrival; }, [onArrival]);

  const emitSubscribeNotifications = useCallback((socket: Socket) => {
    if (emailRef.current) {
      socket.emit("dashboard:subscribe-notifications", { email: emailRef.current });
    } else {
      socket.emit("dashboard:subscribe-notifications");
    }
  }, []);

  useEffect(() => {
    const config = buildRealtimeSocketConfig();
    if (!config) return;

    const socket = io(config.url, {
      path: config.wsPath,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 3000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      emitSubscribeNotifications(socket);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("dashboard:realtime:arrival-notification", (payload: unknown) => {
      onArrivalRef.current?.(payload as ArrivalNotificationPayload);
    });

    socket.on("dashboard:realtime:bus", (raw: unknown) => {
      if (!raw || typeof raw !== "object") return;
      const b = raw as Record<string, unknown>;
      if (typeof b.lat !== "number" || typeof b.lng !== "number") return;
      setTrackedBus({
        busId: typeof b.busId === "string" ? b.busId : "",
        plate: typeof b.plate === "string" ? b.plate : undefined,
        lat: b.lat,
        lng: b.lng,
        etaMinutes: typeof b.estimatedMinutesToNextStop === "number"
          ? b.estimatedMinutesToNextStop : undefined,
        estimatedMinutesToWaitingStop: typeof b.estimatedMinutesToWaitingStop === "number"
          ? b.estimatedMinutesToWaitingStop : undefined,
        occupancyPercent: typeof b.occupancyPercent === "number" ? b.occupancyPercent : undefined,
        isFull: typeof b.isFull === "boolean" ? b.isFull : undefined,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [emitSubscribeNotifications]);

  const activateAlert = useCallback(async (payload: CreateArrivalNotificationDTO) => {
    setAlertState({ ...INITIAL_ALERT_STATE, loading: true });
    try {
      const response = await dashboardRepository.createArrivalNotification(payload);
      const isActive = !!(response.subscribed ?? response.scheduled ?? response.sent ?? response.success);
      setAlertState({
        loading: false,
        active: isActive,
        subscribed: response.subscribed ?? false,
        sent: response.sent ?? false,
        scheduled: response.scheduled ?? false,
        etaMinutes: response.etaMinutes ?? null,
        stopName: response.stopName ?? null,
        error: null,
      });
      const socket = socketRef.current;
      if (socket?.connected) {
        emitSubscribeNotifications(socket);
      }
      return response;
    } catch (err) {
      const msg = getApiErrorMessage(err, "No se pudo activar la alerta");
      setAlertState({ ...INITIAL_ALERT_STATE, error: msg });
      throw err;
    }
  }, [emitSubscribeNotifications]);

  const trackBus = useCallback((busId: string, stopId?: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit("dashboard:subscribe-bus", { busId, ...(stopId ? { stopId } : {}) });
  }, []);

  const reset = useCallback(() => {
    setAlertState(INITIAL_ALERT_STATE);
    setTrackedBus(null);
  }, []);

  return {
    connected,
    alertState,
    trackedBus,
    activateAlert,
    trackBus,
    reset,
  };
}
