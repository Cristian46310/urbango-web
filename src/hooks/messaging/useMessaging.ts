import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ContactInfo,
  ConversationMeta,
  InboxQuery,
  Message,
  SendDirectMessagePayload,
  UserSearchResult,
} from "@/core/types/messaging";
import {
  buildChatList,
  collectPeerIds,
  getThreadMessages,
  getUnreadMessagesInConversation,
  mergeMessages,
} from "@/lib/messaging/chatUtils";
import { userRepository } from "@/infra/repository/security/UserRepository";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast } from "@/lib/toast";
import {
  getConversationMessages,
  getInbox,
  getMessagesHealth,
  markMessageAsRead,
  openDirectConversation,
  openMessage,
  searchUsers,
  sendDirectMessage,
} from "@/services/messageService";
import { useInboxUnreadCountStore } from "@/store/messaging/inboxUnreadCountStore";

const PAGE_SIZE = 50;
const MAX_BODY_LENGTH = 500;

function rememberContactsFromMessages(
  messages: Message[],
  rememberContact: (contact: ContactInfo) => void,
) {
  for (const message of messages) {
    if (!message.senderName && !message.senderEmail) continue;
    rememberContact({
      id: message.senderId,
      name: message.senderName ?? "",
      email: message.senderEmail ?? "",
    });
  }
}

export function useMessaging(currentUserId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Record<string, ContactInfo>>({});
  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;
  const [conversationMeta, setConversationMeta] = useState<Record<string, ConversationMeta>>({});
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inboxUnreadCount = useInboxUnreadCountStore((state) => state.count);
  const refreshUnreadCountFromStore = useInboxUnreadCountStore((state) => state.refreshUnreadCount);
  const decrementUnreadCount = useInboxUnreadCountStore((state) => state.decrementUnreadCount);

  const chats = useMemo(() => {
    if (!currentUserId) return [];
    return buildChatList(messages, currentUserId, contacts, conversationMeta);
  }, [messages, currentUserId, contacts, conversationMeta]);

  const rememberContact = useCallback((contact: ContactInfo) => {
    setContacts((prev) => ({
      ...prev,
      [contact.id]: contact,
    }));
  }, []);

  const rememberConversation = useCallback((meta: ConversationMeta) => {
    setConversationMeta((prev) => ({
      ...prev,
      [meta.conversationId]: meta,
    }));
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!currentUserId) {
      useInboxUnreadCountStore.getState().resetUnreadCount();
      return 0;
    }

    return refreshUnreadCountFromStore(true);
  }, [currentUserId, refreshUnreadCountFromStore]);

  const resolveContactProfiles = useCallback(async (peerIds: string[]) => {
    const missingIds = [...new Set(peerIds.filter((peerId) => peerId.trim() && !contactsRef.current[peerId]))];
    if (missingIds.length === 0) return;

    const results = await Promise.allSettled(
      missingIds.map(async (peerId) => {
        const user = await userRepository.getUser(peerId);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        } satisfies ContactInfo;
      }),
    );

    const resolved = results
      .filter((result): result is PromiseFulfilledResult<ContactInfo> => result.status === "fulfilled")
      .map((result) => result.value);

    if (resolved.length === 0) return;

    setContacts((prev) => {
      const next = { ...prev };
      for (const contact of resolved) {
        next[contact.id] = contact;
      }
      return next;
    });
  }, []);

  const loadInbox = useCallback(
    async (query: InboxQuery = { page: 1, limit: PAGE_SIZE }, silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const inbox = await getInbox(query);
        rememberContactsFromMessages(inbox.items, rememberContact);
        setMessages((prev) => mergeMessages(prev, inbox.items));
        await refreshUnreadCount();
        return inbox.items;
      } catch (err) {
        if (!silent) {
          const message = getApiErrorMessage(err, "No se pudo cargar la bandeja");
          setError(message);
          showErrorToast(message);
        }
        return [];
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [rememberContact, refreshUnreadCount],
  );

  const loadChats = useCallback(
    async (silent = false) => loadInbox({ page: 1, limit: PAGE_SIZE }, silent),
    [loadInbox],
  );

  const loadConversationThread = useCallback(
    async (conversationId: string, silent = false) => {
      if (!conversationId.trim()) return [];

      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const page = await getConversationMessages(conversationId, {
          page: 1,
          limit: PAGE_SIZE,
        });
        rememberContactsFromMessages(page.items, rememberContact);
        setMessages((prev) => mergeMessages(prev, page.items));
        return page.items;
      } catch (err) {
        if (!silent) {
          const message = getApiErrorMessage(err, "No se pudo cargar el hilo");
          setError(message);
          showErrorToast(message);
        }
        return [];
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [rememberContact],
  );

  const searchPeople = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await searchUsers(trimmed, 1, 10);
      setSearchResults(data.items);
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudo buscar usuarios");
      setError(message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const startDirectChat = useCallback(
    async (user: UserSearchResult) => {
      rememberContact(user);

      setLoading(true);
      setError(null);
      try {
        const conversation = await openDirectConversation(user.id);
        const peerId = conversation.memberIds.find((memberId) => memberId !== currentUserId) ?? user.id;

        rememberConversation({
          conversationId: conversation.id,
          type: conversation.type,
          peerId,
          memberIds: conversation.memberIds,
          createdAt: conversation.createdAt,
        });

        return conversation.id;
      } catch (err) {
        const message = getApiErrorMessage(err, "No se pudo abrir la conversación");
        setError(message);
        showErrorToast(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, rememberContact, rememberConversation],
  );

  const sendMessage = useCallback(
    async (payload: SendDirectMessagePayload) => {
      if (!payload.body.trim()) {
        showErrorToast("El mensaje no puede estar vacío");
        return null;
      }
      if (payload.body.length > MAX_BODY_LENGTH) {
        showErrorToast(`El mensaje no puede superar ${MAX_BODY_LENGTH} caracteres`);
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const message = await sendDirectMessage({
          ...payload,
          body: payload.body.trim(),
        });

        setMessages((prev) => mergeMessages(prev, [message]));
        rememberConversation({
          conversationId: message.conversationId,
          type: "direct",
          peerId: payload.recipientId,
        });

        return message;
      } catch (err) {
        const message = getApiErrorMessage(err, "No se pudo enviar el mensaje");
        setError(message);
        showErrorToast(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [rememberConversation],
  );

  const readMessage = useCallback(
    async (messageId: string, silent = false) => {
      if (!silent) {
        const existing = messages.find((item) => item.id === messageId);
        if (existing && !existing.isRead) {
          decrementUnreadCount();
        }
      }

      try {
        const updated = await markMessageAsRead(messageId);
        setMessages((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        void refreshUnreadCount();
        return updated;
      } catch (err) {
        if (!silent) {
          const message = getApiErrorMessage(err, "No se pudo marcar como leído");
          setError(message);
          showErrorToast(message);
        }
        return null;
      }
    },
    [messages, decrementUnreadCount, refreshUnreadCount],
  );

  const openMessageById = useCallback(
    async (messageId: string, silent = false) => {
      try {
        const message = await openMessage(messageId);
        rememberContactsFromMessages([message], rememberContact);
        setMessages((prev) => mergeMessages(prev, [message]));
        await refreshUnreadCount();
        return message;
      } catch (err) {
        if (!silent) {
          const message = getApiErrorMessage(err, "No se pudo abrir el mensaje");
          setError(message);
          showErrorToast(message);
        }
        return null;
      }
    },
    [rememberContact, refreshUnreadCount],
  );

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return;

      const unread = getUnreadMessagesInConversation(
        messages,
        conversationId,
        currentUserId,
      );

      if (unread.length > 0) {
        decrementUnreadCount(unread.length);
      }

      await Promise.all(unread.map((message) => readMessage(message.id, true)));
      void refreshUnreadCount();
    },
    [currentUserId, messages, readMessage, decrementUnreadCount, refreshUnreadCount],
  );

  const checkHealth = useCallback(async () => {
    try {
      const health = await getMessagesHealth();
      setHealthStatus(health.status);
      return health;
    } catch {
      setHealthStatus("offline");
      return null;
    }
  }, []);

  const handleIncomingMessage = useCallback(
    (message: Message) => {
      rememberContactsFromMessages([message], rememberContact);
      setMessages((prev) => mergeMessages(prev, [message]));

      if (!currentUserId || message.senderId === currentUserId) return;

      rememberConversation({
        conversationId: message.conversationId,
        type: message.messageType === "group" ? "group" : "direct",
        peerId: message.senderId,
        groupId: message.groupId,
        groupName: message.groupName,
      });

      void refreshUnreadCount();
    },
    [currentUserId, rememberContact, rememberConversation, refreshUnreadCount],
  );

  const handleMessageRead = useCallback(
    (messageId: string, readAt: string) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId ? { ...item, isRead: true, readAt } : item,
        ),
      );
      void refreshUnreadCount();
    },
    [refreshUnreadCount],
  );

  const handleMessageDeleted = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((item) => item.id !== messageId));
  }, []);

  const getConversationThread = useCallback(
    (conversationId: string) => getThreadMessages(messages, conversationId),
    [messages],
  );

  useEffect(() => {
    if (!currentUserId) return;
    const peerIds = collectPeerIds(messages, conversationMeta, currentUserId);
    void resolveContactProfiles(peerIds);
  }, [currentUserId, messages, conversationMeta, resolveContactProfiles]);

  return {
    chats,
    contacts,
    messages,
    searchResults,
    healthStatus,
    loading,
    error,
    maxBodyLength: MAX_BODY_LENGTH,
    totalUnreadCount: inboxUnreadCount,
    loadChats,
    loadInbox,
    loadConversationThread,
    searchPeople,
    startDirectChat,
    sendMessage,
    readMessage,
    openMessageById,
    markConversationAsRead,
    checkHealth,
    refreshUnreadCount,
    handleIncomingMessage,
    handleMessageRead,
    handleMessageDeleted,
    getConversationThread,
    rememberContact,
    rememberConversation,
    resolveContactProfiles,
    conversationMeta,
  };
}
