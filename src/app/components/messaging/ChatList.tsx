import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Compass, Megaphone, MessageSquarePlus, Search, Users } from "lucide-react";

import type { ChatListItem } from "@/core/types/messaging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatListProps {
  chats: ChatListItem[];
  activeConversationId: string | null;
  loading: boolean;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
  onCreateGroup?: () => void;
  onExplorePublicGroups?: () => void;
  showCreateGroup?: boolean;
  showExplorePublicGroups?: boolean;
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

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ChatList({
  chats,
  activeConversationId,
  loading,
  onSelect,
  onNewChat,
  onCreateGroup,
  onExplorePublicGroups,
  showCreateGroup = false,
  showExplorePublicGroups = false,
  showDriverBroadcast = false,
  onDriverBroadcast,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = useMemo(() => {
    const normalized = searchQuery.trim().toLocaleLowerCase("es");
    if (!normalized) return chats;
    return chats.filter((chat) => {
      const haystack = `${chat.title} ${chat.subtitle}`.toLocaleLowerCase("es");
      return haystack.includes(normalized);
    });
  }, [chats, searchQuery]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col border-r border-(--security-border) bg-card">
        <div className="space-y-3 border-b border-(--security-border) px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Chats</h3>
            <div className="flex gap-1">
              {showExplorePublicGroups && onExplorePublicGroups ? (
                <HeaderIconButton label="Explorar grupos" onClick={onExplorePublicGroups}>
                  <Compass className="size-4" />
                </HeaderIconButton>
              ) : null}
              {showDriverBroadcast && onDriverBroadcast ? (
                <HeaderIconButton label="Aviso a grupos" onClick={onDriverBroadcast}>
                  <Megaphone className="size-4" />
                </HeaderIconButton>
              ) : null}
              {showCreateGroup && onCreateGroup ? (
                <HeaderIconButton label="Crear grupo" onClick={onCreateGroup}>
                  <Users className="size-4" />
                </HeaderIconButton>
              ) : null}
              <HeaderIconButton label="Nuevo chat" onClick={onNewChat}>
                <MessageSquarePlus className="size-4" />
              </HeaderIconButton>
            </div>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchQuery}
              onChange={(event) => { setSearchQuery(event.target.value); }}
              placeholder="Buscar o empezar un chat nuevo"
              className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-9"
              aria-label="Buscar chats"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading && chats.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Cargando chats...</p>
          ) : chats.length === 0 ? (
            <div className="space-y-3 p-4 text-sm text-muted-foreground">
              <p>No tienes conversaciones aún.</p>
              <Button type="button" size="sm" onClick={onNewChat}>
                <MessageSquarePlus className="size-4" />
                Nuevo chat
              </Button>
            </div>
          ) : filteredChats.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No hay chats que coincidan con tu búsqueda.
            </p>
          ) : (
            <div className="divide-y divide-(--security-border)">
              {filteredChats.map((chat) => (
                <button
                  key={chat.conversationId}
                  type="button"
                  onClick={() => { onSelect(chat.conversationId); }}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60",
                    activeConversationId === chat.conversationId && "bg-accent",
                    chat.hasUnread && "bg-primary/5",
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
                      <p className={cn("truncate font-medium", chat.hasUnread && "font-semibold text-foreground")}>
                        {chat.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatChatTime(chat.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm text-muted-foreground", chat.hasUnread && "font-medium text-foreground")}>
                        {chat.subtitle}
                      </p>
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
    </TooltipProvider>
  );
}
