import { useCallback, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import type {
  Message,
  MessageDeletedPayload,
  MessageReadPayload,
  GroupMemberAddedPayload,
} from "@/core/types/messaging";
import { normalizeIncomingMessage } from "@/lib/messaging/chatUtils";

const AUTH_TOKEN_STORAGE_KEY = "authToken";

interface UseMessagingSocketOptions {
  enabled?: boolean;
  activeConversationId?: string | null;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (payload: MessageReadPayload) => void;
  onGroupMemberAdded?: (payload: GroupMemberAddedPayload) => void;
  onMessageDeleted?: (payload: MessageDeletedPayload) => void;
  onReconnect?: () => void;
  onConnectionChange?: (connected: boolean) => void;
}

function emitConversationJoin(socket: Socket, conversationId: string) {
  const trimmed = conversationId.trim();
  if (!trimmed) return;
  socket.emit("conversation:join", { conversationId: trimmed });
}

function queueConversationJoin(pendingJoins: Set<string>, conversationId: string) {
  const trimmed = conversationId.trim();
  if (!trimmed) return;
  pendingJoins.add(trimmed);
}

function flushConversationJoins(socket: Socket, pendingJoins: Set<string>) {
  for (const conversationId of pendingJoins) {
    emitConversationJoin(socket, conversationId);
  }
  pendingJoins.clear();
}

export function useMessagingSocket({
  enabled = true,
  activeConversationId = null,
  onNewMessage,
  onMessageRead,
  onGroupMemberAdded,
  onMessageDeleted,
  onReconnect,
  onConnectionChange,
}: UseMessagingSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pendingJoinsRef = useRef<Set<string>>(new Set());
  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);
  const onGroupMemberAddedRef = useRef(onGroupMemberAdded);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onReconnectRef = useRef(onReconnect);
  const onConnectionChangeRef = useRef(onConnectionChange);

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
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  const joinConversation = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      emitConversationJoin(socket, conversationId);
      return;
    }
    queueConversationJoin(pendingJoinsRef.current, conversationId);
  }, []);

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

    let isFirstConnect = true;

    socket.on("connect", () => {
      onConnectionChangeRef.current?.(true);

      const activeId = activeConversationIdRef.current;
      if (activeId) {
        queueConversationJoin(pendingJoinsRef.current, activeId);
      }
      flushConversationJoins(socket, pendingJoinsRef.current);

      if (!isFirstConnect) {
        onReconnectRef.current?.();
      }
      isFirstConnect = false;
    });

    socket.on("disconnect", () => {
      onConnectionChangeRef.current?.(false);
    });

    socket.on("message:new", (payload: unknown) => {
      const message = normalizeIncomingMessage(payload);
      if (!message) return;
      onNewMessageRef.current?.(message);
    });

    socket.on("message:read", (payload: MessageReadPayload) => {
      onMessageReadRef.current?.(payload);
    });

    socket.on("group:member_added", (payload: GroupMemberAddedPayload) => {
      emitConversationJoin(socket, payload.conversationId);
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

  useEffect(() => {
    if (!activeConversationId) return;
    joinConversation(activeConversationId);
  }, [activeConversationId, joinConversation]);

  return { joinConversation };
}
