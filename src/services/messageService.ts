import { httpMsMessages } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  DirectConversation,
  InboxQuery,
  InboxUnreadCount,
  Message,
  MessagePage,
  MessagePageQuery,
  MessagesHealth,
  SendDirectMessagePayload,
  UserSearchPage,
} from "@/core/types/messaging";

export async function searchUsers(
  query: string,
  page = 1,
  limit = 10,
): Promise<UserSearchPage> {
  return httpMsMessages.get<UserSearchPage>(ENDPOINTS.MESSAGES.USERS_SEARCH, {
    params: { q: query, page, limit },
  });
}

export async function openDirectConversation(
  recipientId: string,
): Promise<DirectConversation> {
  return httpMsMessages.post<DirectConversation>(
    ENDPOINTS.MESSAGES.CONVERSATIONS_DIRECT,
    { recipientId },
  );
}

export async function sendDirectMessage(
  payload: SendDirectMessagePayload,
): Promise<Message> {
  return httpMsMessages.post<Message>(ENDPOINTS.MESSAGES.DIRECT, payload);
}

export async function getInbox(query: InboxQuery = { page: 1, limit: 20 }): Promise<MessagePage> {
  return httpMsMessages.get<MessagePage>(ENDPOINTS.MESSAGES.INBOX, {
    params: query,
  });
}

export async function getInboxUnreadCount(): Promise<InboxUnreadCount> {
  const response = await httpMsMessages.get<InboxUnreadCount | { unreadCount: number }>(
    ENDPOINTS.MESSAGES.INBOX_UNREAD_COUNT,
  );

  if ("count" in response && typeof response.count === "number") {
    return { count: response.count };
  }

  if ("unreadCount" in response && typeof response.unreadCount === "number") {
    return { count: response.unreadCount };
  }

  return { count: 0 };
}

export async function openMessage(messageId: string): Promise<Message> {
  return httpMsMessages.get<Message>(ENDPOINTS.MESSAGES.BY_ID(messageId));
}

export async function getConversationMessages(
  conversationId: string,
  query: MessagePageQuery = { page: 1, limit: 50 },
): Promise<MessagePage> {
  return httpMsMessages.get<MessagePage>(
    ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId),
    { params: query },
  );
}

export async function getSentMessages(
  query: MessagePageQuery,
): Promise<MessagePage> {
  return httpMsMessages.get<MessagePage>(ENDPOINTS.MESSAGES.SENT, {
    params: query,
  });
}

export async function markMessageAsRead(messageId: string): Promise<Message> {
  return httpMsMessages.patch<Message>(ENDPOINTS.MESSAGES.READ(messageId));
}

export async function getMessagesHealth(): Promise<MessagesHealth> {
  return httpMsMessages.get<MessagesHealth>(ENDPOINTS.MESSAGES.HEALTH);
}
