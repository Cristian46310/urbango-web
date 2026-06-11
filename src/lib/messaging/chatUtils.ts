import type {
  ChatListItem,
  ContactInfo,
  ConversationMeta,
  Message,
  MessageGroup,
} from "@/core/types/messaging";

export function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const map = new Map(existing.map((message) => [message.id, message]));
  for (const message of incoming) {
    map.set(message.id, message);
  }
  return Array.from(map.values());
}

export function getContactLabel(contact?: ContactInfo, fallback = "Usuario"): string {
  if (!contact) return fallback;
  return contact.name.trim() || contact.email || fallback;
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

  const chats: ChatListItem[] = [];

  for (const [conversationId, conversationMessages] of grouped) {
    const sorted = [...conversationMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const lastMessage = sorted[sorted.length - 1];
    if (!lastMessage) continue;

    const meta = inferConversationMeta(
      conversationId,
      conversationMessages,
      currentUserId,
      conversationMeta[conversationId],
    );

    const title =
      meta.type === "group"
        ? meta.groupName ?? "Grupo"
        : getContactLabel(meta.peerId ? contacts[meta.peerId] : undefined, "Usuario");

    const unreadCount = conversationMessages.filter(
      (message) => !message.isRead && message.senderId !== currentUserId,
    ).length;

    const isOwnLastMessage = lastMessage.senderId === currentUserId;
    const prefix = isOwnLastMessage ? "Tú: " : "";

    chats.push({
      conversationId,
      type: meta.type,
      title,
      subtitle: `${prefix}${lastMessage.body}`,
      updatedAt: lastMessage.createdAt,
      unreadCount,
      avatarLabel: getAvatarLabel(title),
      peerId: meta.peerId,
    });
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
