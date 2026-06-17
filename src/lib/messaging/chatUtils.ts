import type {
  ChatListItem,
  ContactInfo,
  ConversationMeta,
  Message,
  MessageGroup,
  MessageType,
} from "@/core/types/messaging";

function readString(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}

function readOptionalNumber(source: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function readOptionalBoolean(source: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return undefined;
}

function readMessageType(source: Record<string, unknown>): MessageType | undefined {
  const raw = readString(source, "messageType", "message_type", "type");
  if (raw === "direct" || raw === "group") {
    return raw;
  }
  return undefined;
}

export function normalizeIncomingMessage(raw: unknown): Message | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const envelope = raw as Record<string, unknown>;
  const source =
    envelope.message && typeof envelope.message === "object"
      ? (envelope.message as Record<string, unknown>)
      : envelope;

  const id = readString(source, "id", "_id");
  const conversationId = readString(source, "conversationId", "conversation_id");
  const senderId = readString(source, "senderId", "sender_id");
  const body = readString(source, "body", "content", "text");

  if (!id || !conversationId || !senderId) {
    return null;
  }

  const messageType = readMessageType(source);
  const groupId = readString(source, "groupId", "group_id");

  return {
    id,
    conversationId,
    senderId,
    body,
    latitude: readOptionalNumber(source, "latitude", "lat"),
    longitude: readOptionalNumber(source, "longitude", "lng", "lon"),
    createdAt: readString(source, "createdAt", "created_at") || new Date().toISOString(),
    isRead: readOptionalBoolean(source, "isRead", "is_read") ?? false,
    readAt: readString(source, "readAt", "read_at") || undefined,
    messageType: messageType ?? (groupId ? "group" : "direct"),
    groupId: groupId || undefined,
    groupName: readString(source, "groupName", "group_name") || undefined,
    readCount: readOptionalNumber(source, "readCount", "read_count"),
    totalRecipients: readOptionalNumber(source, "totalRecipients", "total_recipients"),
  };
}

export function isGroupMessage(message: Message): boolean {
  return message.messageType === "group" || Boolean(message.groupId);
}

export function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const map = new Map(existing.map((message) => [message.id, message]));
  for (const message of incoming) {
    if (!message.id) continue;
    map.set(message.id, message);
  }
  return Array.from(map.values());
}

export function getContactLabel(contact?: ContactInfo, fallback = "Usuario"): string {
  if (!contact) return fallback;
  return contact.name.trim() || contact.email || fallback;
}

export function getGroupMemberCount(
  group: MessageGroup,
  messages: Message[] = [],
): number {
  const fromField = group.memberCount ?? 0;
  const fromMembers = group.members?.length ?? 0;
  const fromMessages = messages.reduce(
    (max, message) => Math.max(max, (message.totalRecipients ?? 0) + 1),
    0,
  );

  return Math.max(fromField, fromMembers, fromMessages);
}

export function getAvatarLabel(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function inferConversationMeta(
  conversationId: string,
  messages: Message[],
  currentUserId: string,
  knownMeta?: ConversationMeta,
): ConversationMeta {
  if (knownMeta) {
    return knownMeta;
  }

  const peerId = messages
    .map((message) => message.senderId)
    .find((senderId) => senderId !== currentUserId);

  return {
    conversationId,
    type: "direct",
    peerId,
  };
}

function buildChatListItem(
  conversationId: string,
  conversationMessages: Message[],
  currentUserId: string,
  contacts: Record<string, ContactInfo>,
  knownMeta?: ConversationMeta,
): ChatListItem {
  const meta = inferConversationMeta(
    conversationId,
    conversationMessages,
    currentUserId,
    knownMeta,
  );

  const title =
    meta.type === "group"
      ? meta.groupName ?? "Grupo"
      : getContactLabel(meta.peerId ? contacts[meta.peerId] : undefined, "Usuario");

  const sorted = [...conversationMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const lastMessage = sorted[sorted.length - 1];

  const unreadCount = conversationMessages.filter(
    (message) => !message.isRead && message.senderId !== currentUserId,
  ).length;

  if (lastMessage) {
    const isOwnLastMessage = lastMessage.senderId === currentUserId;
    const prefix = isOwnLastMessage ? "Tú: " : "";

    return {
      conversationId,
      type: meta.type,
      title,
      subtitle: `${prefix}${lastMessage.body}`,
      updatedAt: lastMessage.createdAt,
      unreadCount,
      avatarLabel: getAvatarLabel(title),
      peerId: meta.peerId,
    };
  }

  return {
    conversationId,
    type: meta.type,
    title,
    subtitle: "Sin mensajes aún",
    updatedAt: knownMeta?.createdAt ?? new Date().toISOString(),
    unreadCount: 0,
    avatarLabel: getAvatarLabel(title),
    peerId: meta.peerId,
  };
}

export function buildChatList(
  messages: Message[],
  currentUserId: string,
  contacts: Record<string, ContactInfo>,
  conversationMeta: Record<string, ConversationMeta>,
): ChatListItem[] {
  const grouped = new Map<string, Message[]>();

  for (const message of messages) {
    const current = grouped.get(message.conversationId) ?? [];
    current.push(message);
    grouped.set(message.conversationId, current);
  }

  const processedIds = new Set<string>();
  const chats: ChatListItem[] = [];

  for (const [conversationId, conversationMessages] of grouped) {
    processedIds.add(conversationId);
    chats.push(
      buildChatListItem(
        conversationId,
        conversationMessages,
        currentUserId,
        contacts,
        conversationMeta[conversationId],
      ),
    );
  }

  for (const meta of Object.values(conversationMeta)) {
    if (processedIds.has(meta.conversationId)) continue;
    chats.push(
      buildChatListItem(meta.conversationId, [], currentUserId, contacts, meta),
    );
  }

  return chats.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getThreadMessages(
  messages: Message[],
  conversationId: string,
): Message[] {
  return messages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function collectPeerIds(
  messages: Message[],
  conversationMeta: Record<string, ConversationMeta>,
  currentUserId: string,
): string[] {
  const ids = new Set<string>();

  for (const meta of Object.values(conversationMeta)) {
    if (meta.peerId) {
      ids.add(meta.peerId);
    }
  }

  for (const message of messages) {
    if (message.senderId !== currentUserId) {
      ids.add(message.senderId);
    }
  }

  return Array.from(ids);
}

export function mergeGroupChats(
  messageChats: ChatListItem[],
  groups: MessageGroup[],
): ChatListItem[] {
  const byConversationId = new Map(
    messageChats.map((chat) => [chat.conversationId, chat]),
  );

  for (const group of groups) {
    const existing = byConversationId.get(group.conversationId);
    if (existing) {
      byConversationId.set(group.conversationId, {
        ...existing,
        type: "group",
        title: group.name,
        groupId: group.id,
        iconUrl: group.iconUrl,
        subtitle: existing.subtitle || group.description || "Grupo",
      });
      continue;
    }

    byConversationId.set(group.conversationId, {
      conversationId: group.conversationId,
      type: "group",
      title: group.name,
      subtitle: group.description || "Grupo sin mensajes",
      updatedAt: group.updatedAt ?? group.createdAt ?? new Date().toISOString(),
      unreadCount: 0,
      avatarLabel: getAvatarLabel(group.name),
      groupId: group.id,
      iconUrl: group.iconUrl,
    });
  }

  return Array.from(byConversationId.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function groupToConversationMeta(group: MessageGroup): ConversationMeta {
  return {
    conversationId: group.conversationId,
    type: "group",
    groupId: group.id,
    groupName: group.name,
    groupVisibility: group.visibility,
    groupIconUrl: group.iconUrl,
    memberIds: group.members?.map((member) => member.userId),
  };
}

export function getUnreadMessagesInConversation(
  messages: Message[],
  conversationId: string,
  currentUserId: string,
): Message[] {
  return messages.filter(
    (message) =>
      message.conversationId === conversationId &&
      !message.isRead &&
      message.senderId !== currentUserId,
  );
}
