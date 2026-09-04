import { useCallback, useState } from "react";

import type { Message, SendGroupMessagePayload } from "@/core/types/messaging";
import { mergeMessages } from "@/lib/messaging/chatUtils";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  deleteGroupMessage,
  getGroupMessages,
  getMessageReads,
  sendGroupMessage,
} from "@/services/groupService";
import { markMessageAsRead } from "@/services/messageService";
import { useInboxUnreadCountStore } from "@/store/messaging/inboxUnreadCountStore";

export function useGroupMessages() {
  const [messagesByGroup, setMessagesByGroup] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroupMessages = useCallback(async (groupId: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const page = await getGroupMessages(groupId, 1, 50);
      setMessagesByGroup((prev) => ({
        ...prev,
        [groupId]: page.items,
      }));
      return page.items;
    } catch (err) {
      if (!silent) {
        const message = getApiErrorMessage(err, "No se pudo cargar el historial del grupo");
        setError(message);
      }
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const sendToGroups = useCallback(async (payload: SendGroupMessagePayload) => {
    if (!payload.body.trim()) {
      showErrorToast("El mensaje no puede estar vacío");
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const messages = await sendGroupMessage({
        ...payload,
        body: payload.body.trim(),
      });

      setMessagesByGroup((prev) => {
        const next = { ...prev };
        for (const message of messages) {
          if (!message.groupId) continue;
          next[message.groupId] = mergeMessages(next[message.groupId] ?? [], [message]);
        }
        return next;
      });

      showSuccessToast(
        messages.length > 1
          ? `Mensaje enviado a ${String(messages.length)} grupos`
          : "Mensaje enviado al grupo",
      );
      return messages;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudo enviar el mensaje grupal");
      setError(message);
      showErrorToast(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const markGroupMessageRead = useCallback(async (messageId: string, silent = true) => {
    let wasUnread = false;
    for (const messages of Object.values(messagesByGroup)) {
      const existing = messages.find((item) => item.id === messageId);
      if (existing && !existing.isRead) {
        wasUnread = true;
        break;
      }
    }

    if (wasUnread) {
      useInboxUnreadCountStore.getState().decrementUnreadCount();
    }

    try {
      const updated = await markMessageAsRead(messageId);
      setMessagesByGroup((prev) => {
        const next: Record<string, Message[]> = {};
        for (const [groupId, messages] of Object.entries(prev)) {
          next[groupId] = messages.map((item) =>
            item.id === updated.id
              ? {
                  ...item,
                  ...updated,
                  readCount: updated.readCount ?? item.readCount,
                  totalRecipients: updated.totalRecipients ?? item.totalRecipients,
                }
              : item,
          );
        }
        return next;
      });
      void useInboxUnreadCountStore.getState().refreshUnreadCount();
      return updated;
    } catch (err) {
      if (wasUnread) {
        void useInboxUnreadCountStore.getState().refreshUnreadCount();
      }
      if (!silent) {
        showErrorToast(getApiErrorMessage(err, "No se pudo marcar como leído"));
      }
      return null;
    }
  }, [messagesByGroup]);

  const removeGroupMessage = useCallback(async (messageId: string, groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteGroupMessage(messageId);
      setMessagesByGroup((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).filter((item) => item.id !== messageId),
      }));
      showSuccessToast("Mensaje eliminado");
      return true;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudo eliminar el mensaje");
      setError(message);
      showErrorToast(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessageReads = useCallback(async (messageId: string) => {
    try {
      return await getMessageReads(messageId);
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo cargar quién leyó el mensaje"));
      return null;
    }
  }, []);

  const appendGroupMessage = useCallback((message: Message) => {
    if (!message.groupId) return;
    setMessagesByGroup((prev) => ({
      ...prev,
      [message.groupId as string]: mergeMessages(prev[message.groupId as string] ?? [], [message]),
    }));
  }, []);

  const updateGroupMessageRead = useCallback((payload: {
    messageId: string;
    readAt?: string;
    readCount?: number;
    totalRecipients?: number;
    readerUserId?: string;
  }) => {
    setMessagesByGroup((prev) => {
      const next: Record<string, Message[]> = {};
      for (const [groupId, messages] of Object.entries(prev)) {
        next[groupId] = messages.map((item) => {
          if (item.id !== payload.messageId) return item;

          const totalRecipients = payload.totalRecipients ?? item.totalRecipients;
          let readCount = payload.readCount ?? item.readCount ?? 0;

          if (payload.readCount == null && payload.readerUserId) {
            readCount = Math.min(
              (item.readCount ?? 0) + 1,
              totalRecipients ?? (item.readCount ?? 0) + 1,
            );
          }

          return {
            ...item,
            isRead: true,
            readAt: payload.readAt ?? item.readAt,
            readCount,
            totalRecipients,
          };
        });
      }
      return next;
    });
  }, []);

  const deleteGroupMessageLocal = useCallback((messageId: string, groupId?: string) => {
    setMessagesByGroup((prev) => {
      if (groupId) {
        return {
          ...prev,
          [groupId]: (prev[groupId] ?? []).filter((item) => item.id !== messageId),
        };
      }

      const next: Record<string, Message[]> = {};
      for (const [id, messages] of Object.entries(prev)) {
        next[id] = messages.filter((item) => item.id !== messageId);
      }
      return next;
    });
  }, []);

  const getGroupThread = useCallback(
    (groupId: string) =>
      [...(messagesByGroup[groupId] ?? [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messagesByGroup],
  );

  return {
    loading,
    error,
    loadGroupMessages,
    sendToGroups,
    markGroupMessageRead,
    removeGroupMessage,
    fetchMessageReads,
    appendGroupMessage,
    updateGroupMessageRead,
    deleteGroupMessageLocal,
    getGroupThread,
  };
}
