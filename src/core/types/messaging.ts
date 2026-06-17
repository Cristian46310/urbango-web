import type { BusinessPage, BusinessPageableQuery } from "./BusinessPage";

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
}

export interface DirectConversation {
  id: string;
  type: "direct";
  memberIds: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
}

export interface SendDirectMessagePayload {
  recipientId: string;
  body: string;
  latitude?: number;
  longitude?: number;
}

export interface MessageReadPayload {
  messageId: string;
  conversationId: string;
  readAt: string;
}

export interface MessagesHealth {
  status: string;
  service: string;
}

export type ConversationType = "direct" | "group";

export interface ContactInfo {
  id: string;
  name: string;
  email: string;
}

export interface ConversationMeta {
  conversationId: string;
  type: ConversationType;
  peerId?: string;
  groupName?: string;
  memberIds?: string[];
  createdAt?: string;
}

export interface ChatListItem {
  conversationId: string;
  type: ConversationType;
  title: string;
  subtitle: string;
  updatedAt: string;
  unreadCount: number;
  avatarLabel: string;
  peerId?: string;
}

export type UserSearchPage = BusinessPage<UserSearchResult>;
export type MessagePage = BusinessPage<Message>;
export type MessagePageQuery = BusinessPageableQuery;
