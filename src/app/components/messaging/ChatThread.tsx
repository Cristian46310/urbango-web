import { useEffect, useRef, type ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CheckCheck, Eye, MapPin, Trash2 } from "lucide-react";

import type { Message } from "@/core/types/messaging";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatThreadProps {
  title: string;
  subtitle?: string;
  messages: Message[];
  currentUserId: string;
  loading: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  headerAction?: ReactNode;
  isGroupThread?: boolean;
  canDeleteMessage?: (message: Message) => boolean;
  canViewReads?: (message: Message) => boolean;
  onDeleteMessage?: (message: Message) => void;
  onViewReads?: (message: Message) => void;
}

function formatMessageTime(value: string) {
  try {
    return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: es });
  } catch {
    return value;
  }
}

export function ChatThread({
  title,
  subtitle,
  messages,
  currentUserId,
  loading,
  showBackButton = false,
  onBack,
  headerAction,
  isGroupThread = false,
  canDeleteMessage,
  canViewReads,
  onDeleteMessage,
  onViewReads,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-(--security-surface)">
      <div className="flex shrink-0 items-center gap-3 border-b border-(--security-border) bg-card px-4 py-3">
        {showBackButton ? (
          <Button type="button" size="icon" variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading && messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isGroupThread
              ? "Aún no hay mensajes en este grupo."
              : "Aún no hay mensajes en esta conversación. ¡Envía el primero!"}
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              const showReads = canViewReads?.(message) ?? false;
              const showDelete = canDeleteMessage?.(message) ?? false;
              const hasGroupStats =
                message.readCount != null && message.totalRecipients != null;

              return (
                <div
                  key={message.id}
                  className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      isOwn
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border bg-card",
                      !isOwn && !message.isRead && isGroupThread ? "border-primary/40" : "",
                    )}
                  >
                    {isGroupThread && message.groupName && !isOwn ? (
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                        {message.groupName}
                      </p>
                    ) : null}

                    <p className="whitespace-pre-wrap break-words">{message.body}</p>

                    <div
                      className={cn(
                        "mt-1 flex flex-wrap items-center gap-2 text-[11px]",
                        isOwn ? "text-primary-foreground/80" : "text-muted-foreground",
                      )}
                    >
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {message.latitude != null && message.longitude != null ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {message.latitude.toFixed(4)}, {message.longitude.toFixed(4)}
                        </span>
                      ) : null}
                      {isGroupThread && hasGroupStats ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCheck className="size-3" />
                          Leído {message.readCount}/{message.totalRecipients}
                        </span>
                      ) : null}
                      {!isGroupThread && isOwn && message.isRead && message.readAt ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCheck className="size-3" />
                          Leído
                        </span>
                      ) : null}
                      {!isGroupThread && !isOwn && !message.isRead ? (
                        <span className="text-primary">Nuevo</span>
                      ) : null}
                    </div>

                    {(showReads || showDelete) ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {showReads ? (
                          <Button
                            type="button"
                            size="sm"
                            variant={isOwn ? "secondary" : "outline"}
                            className="h-7 text-xs"
                            onClick={() => { onViewReads?.(message); }}
                          >
                            <Eye className="size-3" />
                            Lecturas
                          </Button>
                        ) : null}
                        {showDelete ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => { onDeleteMessage?.(message); }}
                          >
                            <Trash2 className="size-3" />
                            Eliminar
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
