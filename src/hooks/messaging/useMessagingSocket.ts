import { useCallback, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import type {
  Message,
  MessageDeletedPayload,
  MessageReadPayload,
  GroupMemberAddedPayload,
  GroupMemberLeftPayload,
  GroupMemberPromotedPayload,
  GroupMemberRemovedPayload,
} from "@/core/types/messaging";
import { normalizeIncomingMessage } from "@/lib/messaging/chatUtils";
import { useAuthStore } from "@/store/security/authStore";

const AUTH_TOKEN_STORAGE_KEY = "authToken";
const MESSAGES_NAMESPACE = "/messages";
const MESSAGES_WS_PATH = "/messages/ws";

interface UseMessagingSocketOptions {
  enabled?: boolean;
  activeConversationId?: string | null;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (payload: MessageReadPayload) => void;
  onGroupMemberAdded?: (payload: GroupMemberAddedPayload) => void;
  onGroupMemberLeft?: (payload: GroupMemberLeftPayload) => void;
  onGroupMemberRemoved?: (payload: GroupMemberRemovedPayload) => void;
  onGroupMemberPromoted?: (payload: GroupMemberPromotedPayload) => void;
  onMessageDeleted?: (payload: MessageDeletedPayload) => void;
  onSyncRequired?: () => void;
  onReconnect?: () => void;
  onConnectionChange?: (connected: boolean) => void;
  onUnauthorized?: () => void;
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

function isUnauthorizedPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : "";
  return code.toUpperCase() === "UNAUTHORIZED";
}

export function useMessagingSocket({
  enabled = true,
  activeConversationId = null,
  onNewMessage,
  onMessageRead,
  onGroupMemberAdded,
  onGroupMemberLeft,
  onGroupMemberRemoved,
  onGroupMemberPromoted,
  onMessageDeleted,
  onSyncRequired,
  onReconnect,
  onConnectionChange,
  onUnauthorized,
}: UseMessagingSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pendingJoinsRef = useRef<Set<string>>(new Set());
  const unauthorizedHandledRef = useRef(false);
  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);
  const onGroupMemberAddedRef = useRef(onGroupMemberAdded);
  const onGroupMemberLeftRef = useRef(onGroupMemberLeft);
  const onGroupMemberRemovedRef = useRef(onGroupMemberRemoved);
  const onGroupMemberPromotedRef = useRef(onGroupMemberPromoted);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onSyncRequiredRef = useRef(onSyncRequired);
  const onReconnectRef = useRef(onReconnect);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const onUnauthorizedRef = useRef(onUnauthorized);

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
    onGroupMemberLeftRef.current = onGroupMemberLeft;
  }, [onGroupMemberLeft]);

  useEffect(() => {
    onGroupMemberRemovedRef.current = onGroupMemberRemoved;
  }, [onGroupMemberRemoved]);

  useEffect(() => {
    onGroupMemberPromotedRef.current = onGroupMemberPromoted;
  }, [onGroupMemberPromoted]);

  useEffect(() => {
    onMessageDeletedRef.current = onMessageDeleted;
  }, [onMessageDeleted]);

  useEffect(() => {
    onSyncRequiredRef.current = onSyncRequired;
  }, [onSyncRequired]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

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

    const baseUrl = (import.meta.env.VITE_URL_MS_MESSAGES as string | undefined)?.replace(/\/+$/, "");
    if (!baseUrl) {
      return;
    }

    unauthorizedHandledRef.current = false;

    const socket = io(`${baseUrl}${MESSAGES_NAMESPACE}`, {
      path: MESSAGES_WS_PATH,
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
    });

    let isFirstConnect = true;

    const handleUnauthorized = () => {
      if (unauthorizedHandledRef.current) return;
      unauthorizedHandledRef.current = true;
      socket.io.opts.reconnection = false;
      socket.disconnect();
      onUnauthorizedRef.current?.();
      useAuthStore.getState().logout();
    };

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

    socket.on("sync:required", () => {
      onSyncRequiredRef.current?.();
      onReconnectRef.current?.();
    });

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

    socket.on("group:member_left", (payload: GroupMemberLeftPayload) => {
      onGroupMemberLeftRef.current?.(payload);
    });

    socket.on("group:member_removed", (payload: GroupMemberRemovedPayload) => {
      onGroupMemberRemovedRef.current?.(payload);
    });

    socket.on("group:member_promoted", (payload: GroupMemberPromotedPayload) => {
      onGroupMemberPromotedRef.current?.(payload);
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
