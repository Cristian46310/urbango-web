import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { ChatComposer } from "@/app/components/messaging/ChatComposer";
import { ChatList } from "@/app/components/messaging/ChatList";
import { ChatThread } from "@/app/components/messaging/ChatThread";
import { CreateGroupDialog } from "@/app/components/messaging/CreateGroupDialog";
import { DriverBroadcastDialog } from "@/app/components/messaging/DriverBroadcastDialog";
import { GroupPanel } from "@/app/components/messaging/GroupPanel";
import { MessageReadsDialog, useMessageReadsDialog } from "@/app/components/messaging/MessageReadsDialog";
import { NewChatDialog } from "@/app/components/messaging/NewChatDialog";
import { useGroupMessages } from "@/hooks/messaging/useGroupMessages";
import { useGroups } from "@/hooks/messaging/useGroups";
import { useMessaging } from "@/hooks/messaging/useMessaging";
import { useMessagingSocket } from "@/hooks/messaging/useMessagingSocket";
import { useCitizenProfile } from "@/hooks/useCitizenProfile";
import { useDriverProfile } from "@/hooks/useDriverProfile";
import {
  getGroupMemberCount,
  groupToConversationMeta,
  mergeGroupChats,
} from "@/lib/messaging/chatUtils";
import { showInfoToast } from "@/lib/toast";
import { useAuthStore } from "@/store/security/authStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CreateGroupPayload, Message } from "@/core/types/messaging";

export default function MessagingPage() {
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const { hasCitizenProfile } = useCitizenProfile();
  const { hasDriverProfile } = useDriverProfile();
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
    handleMessageDeleted,
    getConversationThread,
    contacts,
    conversationMeta,
    rememberConversation,
    resolveContactProfiles,
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

  const {
    loading: groupMessagesLoading,
    loadGroupMessages,
    sendToGroups,
    markGroupMessageRead,
    removeGroupMessage,
    fetchMessageReads,
    appendGroupMessage,
    updateGroupMessageRead,
    deleteGroupMessageLocal,
    getGroupThread,
  } = useGroupMessages();

  const readsDialog = useMessageReadsDialog(fetchMessageReads, (userIds) => {
    void resolveContactProfiles(userIds);
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const loading = messagingLoading || groupsLoading || groupMessagesLoading;
  const error = messagingError ?? groupsError;

  useEffect(() => {
    for (const group of groups) {
      rememberConversation(groupToConversationMeta(group));
    }
  }, [groups, rememberConversation]);

  const activeGroup = useMemo(
    () => (activeConversationId ? findGroupByConversationId(activeConversationId) : null),
    [activeConversationId, findGroupByConversationId],
  );

  const groupThreadMessages = useMemo(
    () => (activeGroup ? getGroupThread(activeGroup.id) : []),
    [activeGroup, getGroupThread],
  );

  const chats = useMemo(() => {
    const merged = mergeGroupChats(messageChats, groups);
    return merged.map((chat) => {
      if (chat.type !== "group" || !chat.groupId) return chat;
      const thread = getGroupThread(chat.groupId);
      if (thread.length === 0) return chat;
      const last = thread[thread.length - 1];
      const unreadCount = thread.filter(
        (message) => !message.isRead && message.senderId !== currentUserId,
      ).length;
      const isOwnLastMessage = last.senderId === currentUserId;
      return {
        ...chat,
        subtitle: `${isOwnLastMessage ? "Tú: " : ""}${last.body}`,
        updatedAt: last.createdAt,
        unreadCount,
      };
    });
  }, [messageChats, groups, getGroupThread, currentUserId]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.conversationId === activeConversationId) ?? null,
    [chats, activeConversationId],
  );

  const threadMessages = useMemo(() => {
    if (activeChat?.type === "group" && activeGroup) {
      return groupThreadMessages;
    }
    return activeConversationId ? getConversationThread(activeConversationId) : [];
  }, [
    activeChat?.type,
    activeGroup,
    groupThreadMessages,
    activeConversationId,
    getConversationThread,
  ]);

  const activeContact = useMemo(() => {
    const peerId = activeChat?.peerId;
    return peerId ? contacts[peerId] : undefined;
  }, [activeChat?.peerId, contacts]);

  const driverGroups = useMemo(
    () => groups.filter((group) => isGroupMember(group, currentUserId)),
    [groups, currentUserId, isGroupMember],
  );

  const activeGroupMemberCount = useMemo(() => {
    if (!activeGroup) return 0;
    return getGroupMemberCount(activeGroup, groupThreadMessages);
  }, [activeGroup, groupThreadMessages]);

  const activeGroupId = activeGroup?.id ?? null;

  const refreshMessagingLists = useCallback(
    (silent = false) => {
      void checkHealth();
      void loadChats(silent);
      void loadGroups(hasDriverProfile === true, silent);
    },
    [checkHealth, loadChats, loadGroups, hasDriverProfile],
  );

  useEffect(() => {
    refreshMessagingLists(false);
  }, [refreshMessagingLists]);

  useEffect(() => {
    if (!activeGroupId) return;
    void loadGroupMessages(activeGroupId);
    setGroupInfoOpen(false);
  }, [activeGroupId, loadGroupMessages]);

  const resyncAfterReconnect = useCallback(() => {
    refreshMessagingLists(true);
    if (activeGroupId) {
      void loadGroupMessages(activeGroupId, true);
    }
  }, [refreshMessagingLists, activeGroupId, loadGroupMessages]);

  useEffect(() => {
    if (!activeGroup || !currentUserId) return;
    const unread = groupThreadMessages.filter(
      (message) => !message.isRead && message.senderId !== currentUserId,
    );
    void Promise.all(unread.map((message) => markGroupMessageRead(message.id, true)));
  }, [activeGroup, currentUserId, groupThreadMessages, markGroupMessageRead]);

  useEffect(() => {
    if (!activeConversationId || activeChat?.type === "group") return;
    void markConversationAsRead(activeConversationId);
  }, [activeConversationId, activeChat?.type, markConversationAsRead]);

  const handleSocketMessage = useCallback(
    (message: Message) => {
      if (message.messageType === "group" && message.groupId) {
        appendGroupMessage(message);
        if (message.conversationId === activeConversationId && message.senderId !== currentUserId) {
          void markGroupMessageRead(message.id, true);
        } else if (message.conversationId !== activeConversationId) {
          showInfoToast(message.groupName ? `Nuevo mensaje en ${message.groupName}` : "Nuevo mensaje grupal");
        }
        return;
      }

      handleIncomingMessage(message);

      if (message.conversationId === activeConversationId && message.senderId !== currentUserId) {
        void readMessage(message.id, true);
        return;
      }

      if (message.conversationId !== activeConversationId && message.senderId !== currentUserId) {
        showInfoToast("Tienes un mensaje nuevo");
      }
    },
    [
      activeConversationId,
      appendGroupMessage,
      currentUserId,
      handleIncomingMessage,
      markGroupMessageRead,
      readMessage,
    ],
  );

  useMessagingSocket({
    enabled: Boolean(currentUserId),
    activeConversationId,
    onNewMessage: handleSocketMessage,
    onMessageRead: (payload) => {
      handleMessageRead(payload.messageId, payload.readAt ?? "");
      updateGroupMessageRead({
        messageId: payload.messageId,
        readAt: payload.readAt,
        readCount: payload.readCount,
        totalRecipients: payload.totalRecipients,
        readerUserId: payload.userId,
      });
    },
    onGroupMemberAdded: (payload) => {
      showInfoToast(`Fuiste agregado al grupo "${payload.groupName}"`);
      rememberConversation({
        conversationId: payload.conversationId,
        type: "group",
        groupId: payload.groupId,
        groupName: payload.groupName,
      });
      void loadGroups(hasDriverProfile === true, true);
    },
    onMessageDeleted: (payload) => {
      handleMessageDeleted(payload.messageId);
      deleteGroupMessageLocal(payload.messageId, payload.groupId);
    },
    onReconnect: resyncAfterReconnect,
    onConnectionChange: setSocketConnected,
  });

  const handleSelectChat = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMobileShowThread(true);
  };

  const handleStartChat = async (user: { id: string; name: string; email: string }) => {
    const conversationId = await startDirectChat(user);
    if (!conversationId) return;
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
    if (!activeConversationId || !currentUserId) return false;

    if (activeChat?.type === "group" && activeGroup) {
      if (hasDriverProfile !== true) return false;
      const messages = await sendToGroups({
        groupIds: [activeGroup.id],
        body: payload.body,
        latitude: payload.latitude,
        longitude: payload.longitude,
      });
      return messages.length > 0;
    }

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

  const handleBroadcast = async (payload: {
    groupIds: string[];
    body: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const messages = await sendToGroups(payload);
    return messages.length > 0;
  };

  const isGroupChat = activeChat?.type === "group";
  const canSendInGroup =
    isGroupChat &&
    hasDriverProfile === true &&
    activeGroup &&
    isGroupMember(activeGroup, currentUserId);

  const canDeleteMessage = useCallback(
    (message: Message) =>
      Boolean(
        activeGroup &&
        isGroupAdmin(activeGroup, currentUserId) &&
        message.messageType === "group",
      ),
    [activeGroup, currentUserId, isGroupAdmin],
  );

  const canViewReads = useCallback(
    (message: Message) => {
      if (message.messageType !== "group") return false;
      const isSender = message.senderId === currentUserId;
      const isAdmin = activeGroup ? isGroupAdmin(activeGroup, currentUserId) : false;
      return isSender || isAdmin;
    },
    [activeGroup, currentUserId, isGroupAdmin],
  );

  return (
    <PageShell
      title="Mensajería"
      description="Chats directos, grupos (HU-3-006) y avisos del conductor (HU-3-005)."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="size-4" />
          <span>
            ms-messages:{" "}
            <span className={healthStatus === "ok" ? "text-emerald-600" : "text-amber-600"}>
              {healthStatus === "ok" ? "conectado" : healthStatus ?? "verificando..."}
            </span>
            {" · "}
            websocket:{" "}
            <span className={socketConnected ? "text-emerald-600" : "text-amber-600"}>
              {socketConnected ? "en vivo" : "desconectado"}
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
          {hasDriverProfile === false ? (
            <span className="text-amber-600">
              Sin perfil conductor ·{" "}
              <Link to="/app/register-profile" className="underline">
                registrarse
              </Link>
            </span>
          ) : null}
        </div>
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
              showDriverBroadcast={hasDriverProfile === true}
              onDriverBroadcast={() => { setBroadcastOpen(true); }}
            />
          </div>

          <div
            className={cn(
              "flex h-[560px] flex-col overflow-hidden",
              !mobileShowThread ? "hidden lg:flex" : "flex",
            )}
          >
            {activeChat && currentUserId ? (
              isGroupChat && activeGroup ? (
                <>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                      isGroupThread
                      showBackButton
                      onBack={() => { setMobileShowThread(false); }}
                      headerAction={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => { setGroupInfoOpen(true); }}
                        >
                          Info
                        </Button>
                      }
                      canDeleteMessage={canDeleteMessage}
                      canViewReads={canViewReads}
                      onDeleteMessage={(message) => {
                        void removeGroupMessage(message.id, activeGroup.id);
                      }}
                      onViewReads={(message) => {
                        void readsDialog.showReads(message.id, message.body);
                      }}
                    />
                  </div>
                  {canSendInGroup ? (
                    <ChatComposer
                      loading={loading}
                      maxBodyLength={maxBodyLength}
                      onSend={handleSendInChat}
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                    Inicia un chat directo, crea un grupo o envía un aviso como conductor.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button type="button" onClick={() => { setNewChatOpen(true); }}>
                    Nuevo chat
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setCreateGroupOpen(true); }}>
                    Crear grupo
                  </Button>
                  {hasDriverProfile ? (
                    <Button type="button" variant="outline" onClick={() => { setBroadcastOpen(true); }}>
                      Aviso a grupos
                    </Button>
                  ) : null}
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

      <DriverBroadcastDialog
        open={broadcastOpen}
        loading={loading}
        groups={driverGroups}
        maxBodyLength={maxBodyLength}
        onOpenChange={setBroadcastOpen}
        onSend={handleBroadcast}
      />

      <MessageReadsDialog
        open={readsDialog.open}
        loading={readsDialog.loading}
        reads={readsDialog.reads}
        totalMembers={readsDialog.totalMembers}
        readCount={readsDialog.readCount}
        contacts={contacts}
        messagePreview={readsDialog.messagePreview}
        onOpenChange={readsDialog.setOpen}
      />

      {activeGroup ? (
        <Dialog open={groupInfoOpen} onOpenChange={setGroupInfoOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Información del grupo</DialogTitle>
            </DialogHeader>
            <GroupPanel
              group={activeGroup}
              memberCount={activeGroupMemberCount}
              currentUserId={currentUserId}
              isAdmin={isGroupAdmin(activeGroup, currentUserId)}
              isMember={isGroupMember(activeGroup, currentUserId)}
              loading={loading}
              hasCitizenProfile={hasCitizenProfile}
              searchResults={searchResults}
              onJoin={async () => {
                await joinPublicGroup(activeGroup.id);
                await loadGroups(hasDriverProfile === true);
              }}
              onInvite={async (memberIds) => {
                await inviteMembers(activeGroup.id, memberIds);
                await loadGroups(hasDriverProfile === true);
              }}
              onUpdateIcon={async (iconUrl) => {
                await changeGroupIcon(activeGroup.id, iconUrl);
                await loadGroups(hasDriverProfile === true);
              }}
              onSearch={searchPeople}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </PageShell>
  );
}
