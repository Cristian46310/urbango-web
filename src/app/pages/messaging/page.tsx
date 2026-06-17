import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, RefreshCw } from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { ChatComposer } from "@/app/components/messaging/ChatComposer";
import { ChatList } from "@/app/components/messaging/ChatList";
import { ChatThread } from "@/app/components/messaging/ChatThread";
import { CreateGroupDialog } from "@/app/components/messaging/CreateGroupDialog";
import { GroupPanel } from "@/app/components/messaging/GroupPanel";
import { NewChatDialog } from "@/app/components/messaging/NewChatDialog";
import { useGroups } from "@/hooks/messaging/useGroups";
import { useMessaging } from "@/hooks/messaging/useMessaging";
import { useMessagingSocket } from "@/hooks/messaging/useMessagingSocket";
import { useCitizenProfile } from "@/hooks/useCitizenProfile";
import { mergeGroupChats, groupToConversationMeta } from "@/lib/messaging/chatUtils";
import { showInfoToast } from "@/lib/toast";
import { useAuthStore } from "@/store/security/authStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CreateGroupPayload } from "@/core/types/messaging";

export default function MessagingPage() {
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const { hasCitizenProfile } = useCitizenProfile();
  const {
    chats: messageChats,
    searchResults,
    healthStatus,
    loading: messagingLoading,
    error: messagingError,
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
    rememberConversation,
  } = useMessaging(currentUserId);

  const {
    groups,
    loading: groupsLoading,
    error: groupsError,
    loadGroups,
    createNewGroup,
    joinPublicGroup,
    inviteMembers,
    changeGroupIcon,
    findGroupByConversationId,
    isGroupAdmin,
    isGroupMember,
  } = useGroups();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const loading = messagingLoading || groupsLoading;
  const error = messagingError ?? groupsError;

  useEffect(() => {
    void checkHealth();
    void loadChats();
    void loadGroups();
  }, [checkHealth, loadChats, loadGroups]);

  useEffect(() => {
    for (const group of groups) {
      rememberConversation(groupToConversationMeta(group));
    }
  }, [groups, rememberConversation]);

  const chats = useMemo(
    () => mergeGroupChats(messageChats, groups),
    [messageChats, groups],
  );

  const activeChat = useMemo(
    () => chats.find((chat) => chat.conversationId === activeConversationId) ?? null,
    [chats, activeConversationId],
  );

  const activeGroup = useMemo(
    () => (activeConversationId ? findGroupByConversationId(activeConversationId) : null),
    [activeConversationId, findGroupByConversationId],
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
    if (!activeConversationId || activeChat?.type === "group") return;
    void markConversationAsRead(activeConversationId);
  }, [activeConversationId, activeChat?.type, markConversationAsRead]);

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
    onGroupMemberAdded: (payload) => {
      showInfoToast(`Fuiste agregado al grupo "${payload.groupName}"`);
      void loadGroups();
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

  const handleCreateGroup = async (payload: CreateGroupPayload, iconUrl?: string) => {
    const group = await createNewGroup(payload);
    if (!group) return false;

    if (iconUrl) {
      await changeGroupIcon(group.id, iconUrl);
    }

    rememberConversation(groupToConversationMeta(group));
    setActiveConversationId(group.conversationId);
    setMobileShowThread(true);
    return true;
  };

  const handleSendInChat = async (payload: {
    body: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!activeConversationId || !currentUserId || activeChat?.type === "group") return false;

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
    void loadGroups();
  };

  const isGroupChat = activeChat?.type === "group";

  return (
    <PageShell
      title="Mensajería"
      description="Chats directos y grupos de comunicación (HU-ENTR-3-006)."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
          {hasCitizenProfile === false ? (
            <span className="text-amber-600">
              Sin perfil ciudadano ·{" "}
              <Link to="/app/register-profile" className="underline">
                registrarse
              </Link>
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
              onCreateGroup={() => { setCreateGroupOpen(true); }}
            />
          </div>

          <div
            className={cn(
              "flex h-[560px] flex-col",
              !mobileShowThread ? "hidden lg:flex" : "flex",
            )}
          >
            {activeChat && currentUserId ? (
              isGroupChat && activeGroup ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  {threadMessages.length > 0 ? (
                    <div className="min-h-0 flex-1 border-b">
                      <ChatThread
                        title={activeGroup.name}
                        subtitle={
                          activeGroup.visibility === "public"
                            ? "Grupo público"
                            : "Grupo privado"
                        }
                        messages={threadMessages}
                        currentUserId={currentUserId}
                        loading={loading}
                        showBackButton
                        onBack={() => { setMobileShowThread(false); }}
                      />
                    </div>
                  ) : null}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <GroupPanel
                      group={activeGroup}
                      currentUserId={currentUserId}
                      isAdmin={isGroupAdmin(activeGroup, currentUserId)}
                      isMember={isGroupMember(activeGroup, currentUserId)}
                      loading={loading}
                      hasCitizenProfile={hasCitizenProfile}
                      searchResults={searchResults}
                      onJoin={async () => {
                        await joinPublicGroup(activeGroup.id);
                        await loadGroups();
                      }}
                      onInvite={async (memberIds) => {
                        await inviteMembers(activeGroup.id, memberIds);
                        await loadGroups();
                      }}
                      onUpdateIcon={async (iconUrl) => {
                        await changeGroupIcon(activeGroup.id, iconUrl);
                        await loadGroups();
                      }}
                      onSearch={searchPeople}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-h-0 flex-1">
                    <ChatThread
                      title={activeContact?.name ?? activeChat.title}
                      subtitle={activeContact?.email}
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
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-(--security-surface) p-8 text-center">
                <MessageCircle className="size-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Selecciona un chat</p>
                  <p className="text-sm text-muted-foreground">
                    Inicia un chat directo o crea un grupo de comunicación.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => { setNewChatOpen(true); }}>
                    Nuevo chat
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setCreateGroupOpen(true); }}>
                    Crear grupo
                  </Button>
                </div>
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

      <CreateGroupDialog
        open={createGroupOpen}
        loading={loading}
        hasCitizenProfile={hasCitizenProfile}
        results={searchResults}
        currentUserId={currentUserId}
        onOpenChange={setCreateGroupOpen}
        onSearch={searchPeople}
        onCreate={handleCreateGroup}
      />
    </PageShell>
  );
}
