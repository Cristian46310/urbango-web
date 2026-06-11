import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import type {
  Message,
  MessageDeletedPayload,
  MessageReadPayload,
  GroupMemberAddedPayload,
} from "@/core/types/messaging";

const AUTH_TOKEN_STORAGE_KEY = "authToken";

interface UseMessagingSocketOptions {
  enabled?: boolean;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (payload: MessageReadPayload) => void;
  onGroupMemberAdded?: (payload: GroupMemberAddedPayload) => void;
  onMessageDeleted?: (payload: MessageDeletedPayload) => void;
}

export function useMessagingSocket({
  enabled = true,
  onNewMessage,
  onMessageRead,
  onGroupMemberAdded,
  onMessageDeleted,
}: UseMessagingSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);
  const onGroupMemberAddedRef = useRef(onGroupMemberAdded);
  const onMessageDeletedRef = useRef(onMessageDeleted);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onMessageReadRef.current = onMessageRead;
  }, [onMessageRead]);

  useEffect(() => {
    onGroupMemberAddedRef.current = onGroupMemberAdded;
  }, [onGroupMemberAdded]);

  useEffect(() => {
    onMessageDeletedRef.current = onMessageDeleted;
  }, [onMessageDeleted]);

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

    socket.on("group:member_added", (payload: GroupMemberAddedPayload) => {
      onGroupMemberAddedRef.current?.(payload);
    });

    socket.on("message:deleted", (payload: MessageDeletedPayload) => {
      onMessageDeletedRef.current?.(payload);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);
}
