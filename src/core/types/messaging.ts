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

export type MessageType = "direct" | "group";

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
  messageType?: MessageType;
  groupId?: string;
  groupName?: string;
  readCount?: number;
  totalRecipients?: number;
}

export interface SendGroupMessagePayload {
  groupIds: string[];
  body: string;
  latitude?: number;
  longitude?: number;
}

export interface MessageReadEntry {
  userId: string;
  readAt: string;
}

export interface MessageReadsResponse {
  messageId: string;
  conversationId?: string;
  groupId?: string;
  groupName?: string;
  readBy: MessageReadEntry[];
  totalMembers?: number;
  readCount?: number;
}

export interface MessageDeletedPayload {
  messageId: string;
  conversationId: string;
  groupId?: string;
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
  readCount?: number;
  totalRecipients?: number;
  userId?: string;
  groupId?: string;
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

export type GroupVisibility = "public" | "private";

export type GroupMemberRole = "admin" | "member";

export interface GroupMember {
  userId: string;
  role: GroupMemberRole;
}

export interface MessageGroup {
  id: string;
  name: string;
  description?: string;
  visibility: GroupVisibility;
  conversationId: string;
  iconUrl?: string;
  members?: GroupMember[];
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  visibility: GroupVisibility;
  memberIds: string[];
}

export interface AddGroupMembersPayload {
  memberIds: string[];
}

export interface UpdateGroupIconPayload {
  iconUrl: string;
}

export interface GroupMemberAddedPayload {
  groupId: string;
  groupName: string;
  conversationId: string;
  role: GroupMemberRole;
}

export type GroupPage = BusinessPage<MessageGroup>;

export interface ConversationMeta {
  conversationId: string;
  type: ConversationType;
  peerId?: string;
  groupId?: string;
  groupName?: string;
  groupVisibility?: GroupVisibility;
  groupIconUrl?: string;
  memberIds?: string[];
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
  groupId?: string;
  iconUrl?: string;
}

export type UserSearchPage = BusinessPage<UserSearchResult>;
export type MessagePage = BusinessPage<Message>;
export type MessagePageQuery = BusinessPageableQuery;
