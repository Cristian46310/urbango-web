import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { ChatComposer } from "@/app/components/messaging/ChatComposer";
import { ChatList } from "@/app/components/messaging/ChatList";
import { ChatThread } from "@/app/components/messaging/ChatThread";
import { NewChatDialog } from "@/app/components/messaging/NewChatDialog";
import { useMessaging } from "@/hooks/messaging/useMessaging";
import { useMessagingSocket } from "@/hooks/messaging/useMessagingSocket";
import { showInfoToast } from "@/lib/toast";
import { useAuthStore } from "@/store/security/authStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MessagingPage() {
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const {
    chats,
    searchResults,
    healthStatus,
    loading,
    error,
    maxBodyLength,
    totalUnreadCount,
    loadChats,
    searchPeople,
    startDirectChat,
    sendMessage,
    markConversationAsRead,
    readMessage,
    checkHealth,
    handleIncomingMessage,
    handleMessageRead,
    getConversationThread,
    contacts,
    conversationMeta,
  } = useMessaging(currentUserId);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  useEffect(() => {
    void checkHealth();
    void loadChats();
  }, [checkHealth, loadChats]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.conversationId === activeConversationId) ?? null,
    [chats, activeConversationId],
  );

  const threadMessages = useMemo(
    () => (activeConversationId ? getConversationThread(activeConversationId) : []),
    [activeConversationId, getConversationThread],
  );

  const activeContact = useMemo(() => {
    const peerId = activeChat?.peerId;
    return peerId ? contacts[peerId] : undefined;
  }, [activeChat?.peerId, contacts]);

  useEffect(() => {
    if (!activeConversationId) return;
    void markConversationAsRead(activeConversationId);
  }, [activeConversationId, markConversationAsRead]);

  const handleSocketMessage = useCallback(
    (message: Parameters<typeof handleIncomingMessage>[0]) => {
      handleIncomingMessage(message);

      if (message.conversationId === activeConversationId && message.senderId !== currentUserId) {
        void readMessage(message.id, true);
        return;
      }

      if (message.conversationId !== activeConversationId) {
        showInfoToast("Tienes un mensaje nuevo");
      }
    },
    [activeConversationId, currentUserId, handleIncomingMessage, readMessage],
  );

  useMessagingSocket({
    enabled: Boolean(currentUserId),
    onNewMessage: handleSocketMessage,
    onMessageRead: (payload) => {
      handleMessageRead(payload.messageId, payload.readAt);
    },
  });

  const handleSelectChat = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMobileShowThread(true);
  };

  const handleStartChat = async (user: { id: string; name: string; email: string }) => {
    const conversationId = await startDirectChat(user);
    if (!conversationId) return;
    setNewChatOpen(false);
    setActiveConversationId(conversationId);
    setMobileShowThread(true);
  };

  const handleSendInChat = async (payload: {
    body: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!activeConversationId || !currentUserId) return false;

    const meta = conversationMeta[activeConversationId];
    const peerId = meta?.peerId ?? activeChat?.peerId;
    if (!peerId) {
      showInfoToast("No se pudo identificar el destinatario del chat");
      return false;
    }

    const message = await sendMessage({
      recipientId: peerId,
      body: payload.body,
      latitude: payload.latitude,
      longitude: payload.longitude,
    });

    return Boolean(message);
  };

  const handleRefresh = () => {
    void checkHealth();
    void loadChats();
  };

  return (
    <PageShell
      title="Mensajería"
      description="Chats directos en tiempo real. Los grupos se habilitarán próximamente."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="size-4" />
          <span>
            ms-messages:{" "}
            <span className={healthStatus === "ok" ? "text-emerald-600" : "text-amber-600"}>
              {healthStatus === "ok" ? "conectado" : healthStatus ?? "verificando..."}
            </span>
          </span>
          {totalUnreadCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {totalUnreadCount} sin leer
            </span>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className="size-4" />
          Actualizar
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card className="overflow-hidden">
        <div className="grid min-h-[560px] lg:grid-cols-[320px_1fr]">
          <div
            className={cn(
              "h-[560px]",
              mobileShowThread ? "hidden lg:block" : "block",
            )}
          >
            <ChatList
              chats={chats}
              activeConversationId={activeConversationId}
              loading={loading}
              onSelect={handleSelectChat}
              onNewChat={() => { setNewChatOpen(true); }}
            />
          </div>

          <div
            className={cn(
              "flex h-[560px] flex-col",
              !mobileShowThread ? "hidden lg:flex" : "flex",
            )}
          >
            {activeChat && currentUserId ? (
              <>
                <div className="min-h-0 flex-1">
                  <ChatThread
                    title={activeContact?.name ?? activeChat.title}
                    subtitle={
                      activeChat.type === "group"
                        ? "Chat grupal"
                        : activeContact?.email
                    }
                    messages={threadMessages}
                    currentUserId={currentUserId}
                    loading={loading}
                    showBackButton
                    onBack={() => { setMobileShowThread(false); }}
                  />
                </div>
                <ChatComposer
                  loading={loading}
                  maxBodyLength={maxBodyLength}
                  onSend={handleSendInChat}
                />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-(--security-surface) p-8 text-center">
                <MessageCircle className="size-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Selecciona un chat</p>
                  <p className="text-sm text-muted-foreground">
                    Elige una conversación de la lista o inicia un chat nuevo.
                  </p>
                </div>
                <Button type="button" onClick={() => { setNewChatOpen(true); }}>
                  Nuevo chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <NewChatDialog
        open={newChatOpen}
        results={searchResults}
        loading={loading}
        onOpenChange={setNewChatOpen}
        onSearch={searchPeople}
        onSelectUser={(user) => { void handleStartChat(user); }}
      />
    </PageShell>
  );
}
