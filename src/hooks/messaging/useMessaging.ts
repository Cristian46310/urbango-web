import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ContactInfo,
  ConversationMeta,
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
  getInbox,
  getMessagesHealth,
  getSentMessages,
  markMessageAsRead,
  openDirectConversation,
  searchUsers,
  sendDirectMessage,
} from "@/services/messageService";

const PAGE_SIZE = 50;
const MAX_BODY_LENGTH = 500;

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

  const loadChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inbox, sent] = await Promise.all([
        getInbox({ page: 1, limit: PAGE_SIZE }),
        getSentMessages({ page: 1, limit: PAGE_SIZE }),
      ]);
      const merged = mergeMessages([], [...inbox.items, ...sent.items]);
      setMessages((prev) => mergeMessages(prev, merged));
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudieron cargar los chats");
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const readMessage = useCallback(async (messageId: string, silent = false) => {
    try {
      const updated = await markMessageAsRead(messageId);
      setMessages((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      return updated;
    } catch (err) {
      if (!silent) {
        const message = getApiErrorMessage(err, "No se pudo marcar como leído");
        setError(message);
        showErrorToast(message);
      }
      return null;
    }
  }, []);

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return;

      const unread = getUnreadMessagesInConversation(
        messages,
        conversationId,
        currentUserId,
      );

      await Promise.all(unread.map((message) => readMessage(message.id, true)));
    },
    [currentUserId, messages, readMessage],
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
      setMessages((prev) => mergeMessages(prev, [message]));

      if (currentUserId && message.senderId !== currentUserId) {
        rememberConversation({
          conversationId: message.conversationId,
          type: "direct",
          peerId: message.senderId,
        });
      }
    },
    [currentUserId, rememberConversation],
  );

  const handleMessageRead = useCallback((messageId: string, readAt: string) => {
    setMessages((prev) =>
      prev.map((item) =>
        item.id === messageId ? { ...item, isRead: true, readAt } : item,
      ),
    );
  }, []);

  const getConversationThread = useCallback(
    (conversationId: string) => getThreadMessages(messages, conversationId),
    [messages],
  );

  const totalUnreadCount = useMemo(
    () => chats.reduce((sum, chat) => sum + chat.unreadCount, 0),
    [chats],
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
    totalUnreadCount,
    loadChats,
    searchPeople,
    startDirectChat,
    sendMessage,
    readMessage,
    markConversationAsRead,
    checkHealth,
    handleIncomingMessage,
    handleMessageRead,
    getConversationThread,
    rememberContact,
    rememberConversation,
    resolveContactProfiles,
    conversationMeta,
  };
}
