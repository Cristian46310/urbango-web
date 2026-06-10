import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CheckCheck, MapPin } from "lucide-react";

import type { Message } from "@/core/types/messaging";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatThreadProps {
  title: string;
  subtitle?: string;
  messages: Message[];
  currentUserId: string;
  loading: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
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
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-(--security-surface)">
      <div className="flex items-center gap-3 border-b border-(--security-border) bg-card px-4 py-3">
        {showBackButton ? (
          <Button type="button" size="icon" variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
        ) : null}
        <div className="min-w-0">
          <p className="truncate font-semibold">{title}</p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        {loading && messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay mensajes en esta conversación. ¡Envía el primero!
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUserId;

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
                    )}
                  >
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
                      {isOwn && message.isRead && message.readAt ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCheck className="size-3" />
                          Leído
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
