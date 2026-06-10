import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import type { Message, MessageReadPayload } from "@/core/types/messaging";

const AUTH_TOKEN_STORAGE_KEY = "authToken";

interface UseMessagingSocketOptions {
  enabled?: boolean;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (payload: MessageReadPayload) => void;
}

export function useMessagingSocket({
  enabled = true,
  onNewMessage,
  onMessageRead,
}: UseMessagingSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onMessageReadRef.current = onMessageRead;
  }, [onMessageRead]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) {
      return;
    }

    const baseUrl = import.meta.env.VITE_URL_MS_MESSAGES as string;
    const socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("message:new", (message: Message) => {
      onNewMessageRef.current?.(message);
    });

    socket.on("message:read", (payload: MessageReadPayload) => {
      onMessageReadRef.current?.(payload);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);
}
