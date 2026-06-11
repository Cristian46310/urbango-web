import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Megaphone, MessageSquarePlus, Users } from "lucide-react";

import type { ChatListItem } from "@/core/types/messaging";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatListProps {
  chats: ChatListItem[];
  activeConversationId: string | null;
  loading: boolean;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
  onCreateGroup: () => void;
  showDriverBroadcast?: boolean;
  onDriverBroadcast?: () => void;
}

function formatChatTime(value: string) {
  try {
    return format(new Date(value), "dd MMM HH:mm", { locale: es });
  } catch {
    return "";
  }
}

export function ChatList({
  chats,
  activeConversationId,
  loading,
  onSelect,
  onNewChat,
  onCreateGroup,
  showDriverBroadcast = false,
  onDriverBroadcast,
}: ChatListProps) {
  return (
    <div className="flex h-full flex-col border-r border-(--security-border) bg-card">
      <div className="flex items-center justify-between border-b border-(--security-border) px-4 py-3">
        <h3 className="font-semibold">Chats</h3>
        <div className="flex gap-1">
          {showDriverBroadcast && onDriverBroadcast ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onDriverBroadcast}
              title="Aviso a grupos"
            >
              <Megaphone className="size-4" />
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={onCreateGroup} title="Crear grupo">
            <Users className="size-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onNewChat} title="Nuevo chat">
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading && chats.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Cargando chats...</p>
        ) : chats.length === 0 ? (
          <div className="space-y-3 p-4 text-sm text-muted-foreground">
            <p>No tienes conversaciones aún.</p>
            <Button type="button" size="sm" onClick={onNewChat}>
              Iniciar chat
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-(--security-border)">
            {chats.map((chat) => (
              <button
                key={chat.conversationId}
                type="button"
                onClick={() => { onSelect(chat.conversationId); }}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60",
                  activeConversationId === chat.conversationId && "bg-accent",
                )}
              >
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {chat.iconUrl ? (
                    <img src={chat.iconUrl} alt="" className="size-full object-cover" />
                  ) : chat.type === "group" ? (
                    <Users className="size-5" />
                  ) : (
                    chat.avatarLabel
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{chat.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatChatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-muted-foreground">{chat.subtitle}</p>
                    {chat.unreadCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
