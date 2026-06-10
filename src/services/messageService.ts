import { httpMsMessages } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  DirectConversation,
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

export async function getInbox(query: MessagePageQuery): Promise<MessagePage> {
  return httpMsMessages.get<MessagePage>(ENDPOINTS.MESSAGES.INBOX, {
    params: query,
  });
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
