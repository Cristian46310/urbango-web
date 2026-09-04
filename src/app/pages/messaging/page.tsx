import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Compass,
  MessageCircle,
  MessageSquarePlus,
  Users,
} from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { ChatComposer } from "@/app/components/messaging/ChatComposer";
import { ChatList } from "@/app/components/messaging/ChatList";
import { ChatThread } from "@/app/components/messaging/ChatThread";
import { CreateGroupDialog } from "@/app/components/messaging/CreateGroupDialog";
import { DriverBroadcastDialog } from "@/app/components/messaging/DriverBroadcastDialog";
import { PublicGroupsDialog } from "@/app/components/messaging/PublicGroupsDialog";
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
  getThreadMessages,
  groupToConversationMeta,
  isGroupMessage,
  mergeGroupChats,
} from "@/lib/messaging/chatUtils";
import { showInfoToast, showWarningToast } from "@/lib/toast";
import { useAuthStore } from "@/store/security/authStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CreateGroupPayload, Message, MessageGroup } from "@/core/types/messaging";

export default function MessagingPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentUserId = currentUser?.id;
  const { hasCitizenProfile } = useCitizenProfile();
  const { hasDriverProfile } = useDriverProfile();
  const {
    chats: messageChats,
    searchResults,
    loading: messagingLoading,
    error: messagingError,
    maxBodyLength,
    loadChats,
    loadConversationThread,
    searchPeople,
    startDirectChat,
    sendMessage,
    markConversationAsRead,
    readMessage,
    openMessageById,
    checkHealth,
    refreshUnreadCount,
    handleIncomingMessage,
    handleMessageRead,
    handleMessageDeleted,
    messages,
    contacts,
    conversationMeta,
    rememberConversation,
    resolveContactProfiles,
  } = useMessaging(currentUserId);

  const {
    groups,
    loading: groupsLoading,
    error: groupsError,
    members,
    membersLoading,
    membershipLog,
    membershipLogLoading,
    loadGroups,
    fetchGroupById,
    createNewGroup,
    joinPublicGroup,
    leaveGroup,
    removeGroupLocally,
    inviteMembers,
    changeGroupIcon,
    loadGroupMembers,
    promoteMember,
    demoteMember,
    removeMember,
    loadMembershipLog,
    upsertGroup,
    findGroupByConversationId,
    isGroupAdmin,
    isGroupMember,
    getMyRole,
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
  const [publicGroupsOpen, setPublicGroupsOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [, setSocketConnected] = useState(false);

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
        subtitle: `${isOwnLastMessage ? "Tú: " : ""}${last.preview ?? last.body}`,
        updatedAt: last.createdAt,
        unreadCount,
        hasUnread: unreadCount > 0,
      };
    });
  }, [messageChats, groups, getGroupThread, currentUserId]);

  const activeDirectMeta = useMemo(() => {
    if (!activeConversationId) return null;
    return conversationMeta[activeConversationId] ?? null;
  }, [activeConversationId, conversationMeta]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.conversationId === activeConversationId) ?? null,
    [chats, activeConversationId],
  );

  const canShowActiveThread = Boolean(
    currentUserId &&
    activeConversationId &&
    (activeChat || activeDirectMeta?.type === "direct" || activeGroup),
  );

  const threadMessages = useMemo(() => {
    if (activeChat?.type === "group" && activeGroup) {
      return groupThreadMessages;
    }
    return activeConversationId ? getThreadMessages(messages, activeConversationId) : [];
  }, [
    activeChat?.type,
    activeGroup,
    groupThreadMessages,
    activeConversationId,
    messages,
  ]);

  const activeContact = useMemo(() => {
    const peerId = activeChat?.peerId ?? activeDirectMeta?.peerId;
    return peerId ? contacts[peerId] : undefined;
  }, [activeChat?.peerId, activeDirectMeta?.peerId, contacts]);

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
      // Groups require a citizen profile; skip to avoid 403 toasts duplicating the amber banner.
      if (hasCitizenProfile === true) {
        void loadGroups(hasDriverProfile === true, silent);
      }
    },
    [checkHealth, loadChats, loadGroups, hasCitizenProfile, hasDriverProfile],
  );

  useEffect(() => {
    // Wait until profile status is known so we don't fire group APIs that 403.
    if (hasCitizenProfile === null) return;
    refreshMessagingLists(false);
  }, [refreshMessagingLists, hasCitizenProfile]);

  useEffect(() => {
    if (!activeConversationId || activeChat?.type === "group") return;
    void loadConversationThread(activeConversationId, true);
  }, [activeConversationId, activeChat?.type, loadConversationThread]);

  useEffect(() => {
    if (!activeGroupId) return;
    void loadGroupMessages(activeGroupId);
    setGroupInfoOpen(false);
  }, [activeGroupId, loadGroupMessages]);

  useEffect(() => {
    if (!groupInfoOpen || !activeGroupId) return;
    void fetchGroupById(activeGroupId, true);
  }, [groupInfoOpen, activeGroupId, fetchGroupById]);

  const resyncAfterReconnect = useCallback(() => {
    refreshMessagingLists(true);
    void refreshUnreadCount();
    if (activeGroupId) {
      void loadGroupMessages(activeGroupId, true);
    }
    if (activeConversationId && activeChat?.type !== "group") {
      void loadConversationThread(activeConversationId, true);
    }
  }, [
    refreshMessagingLists,
    refreshUnreadCount,
    activeGroupId,
    loadGroupMessages,
    activeConversationId,
    activeChat?.type,
    loadConversationThread,
  ]);

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
      if (isGroupMessage(message) && message.groupId) {
        appendGroupMessage(message);
        if (message.conversationId === activeConversationId && message.senderId !== currentUserId) {
          void markGroupMessageRead(message.id, true);
        } else if (message.conversationId !== activeConversationId && message.senderId !== currentUserId) {
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

  const { joinConversation } = useMessagingSocket({
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
      const toastMessage =
        payload.welcomeMessage ?? `Fuiste agregado al grupo "${payload.groupName}"`;
      showInfoToast(toastMessage);
      rememberConversation({
        conversationId: payload.conversationId,
        type: "group",
        groupId: payload.groupId,
        groupName: payload.groupName,
      });
      void loadGroups(hasDriverProfile === true, true);
    },
    onGroupMemberLeft: (payload) => {
      if (payload.groupId === activeGroupId && groupInfoOpen) {
        void loadGroupMembers(payload.groupId, undefined, true);
        void loadMembershipLog(payload.groupId, true);
      }
    },
    onGroupMemberRemoved: (payload) => {
      if (payload.userId === currentUserId) {
        showWarningToast("Fuiste removido del grupo");
        removeGroupLocally(payload.groupId);
        if (payload.conversationId === activeConversationId) {
          setActiveConversationId(null);
          setMobileShowThread(false);
          setGroupInfoOpen(false);
        }
        return;
      }
      if (payload.groupId === activeGroupId && groupInfoOpen) {
        void loadGroupMembers(payload.groupId, undefined, true);
        void loadMembershipLog(payload.groupId, true);
      }
    },
    onGroupMemberPromoted: (payload) => {
      if (payload.userId === currentUserId) {
        showInfoToast("Fuiste promovido a administrador del grupo");
        if (activeGroupId) {
          void fetchGroupById(activeGroupId, true);
        }
      }
      if (payload.groupId === activeGroupId && groupInfoOpen) {
        void loadGroupMembers(payload.groupId, undefined, true);
        void loadMembershipLog(payload.groupId, true);
      }
    },
    onMessageDeleted: (payload) => {
      handleMessageDeleted(payload.messageId);
      deleteGroupMessageLocal(payload.messageId, payload.groupId);
    },
    onReconnect: resyncAfterReconnect,
    onConnectionChange: setSocketConnected,
  });

  const openGroupChat = useCallback(
    async (group: MessageGroup) => {
      upsertGroup(group);
      rememberConversation(groupToConversationMeta(group));
      joinConversation(group.conversationId);
      await loadGroupMessages(group.id);
      setActiveConversationId(group.conversationId);
      setMobileShowThread(true);
    },
    [upsertGroup, rememberConversation, joinConversation, loadGroupMessages],
  );

  const handleSelectChat = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMobileShowThread(true);

    const chat = chats.find((item) => item.conversationId === conversationId);
    if (chat?.type !== "group" && chat?.lastMessageId && chat.hasUnread) {
      void openMessageById(chat.lastMessageId, true);
    }
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
      description="Chats directos, grupos públicos y avisos del conductor."
    >
      <div className="space-y-3">
        {hasCitizenProfile === false ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              <p>Necesitas un perfil de ciudadano para crear o unirte a grupos.</p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-amber-300 bg-white">
              <Link to="/app/register-profile">Crear perfil de ciudadano</Link>
            </Button>
          </div>
        ) : null}

        {hasDriverProfile === false ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              <p>
                Para enviar avisos a grupos necesitas el rol de conductor. Si
                crees que debería estar habilitado, contacta al soporte técnico.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-amber-300 bg-white">
              <Link to="/app/support/pqrs">Contactar soporte</Link>
            </Button>
          </div>
        ) : null}
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
              showCreateGroup={hasCitizenProfile === true}
              onCreateGroup={() => { setCreateGroupOpen(true); }}
              showExplorePublicGroups={hasCitizenProfile === true}
              onExplorePublicGroups={() => { setPublicGroupsOpen(true); }}
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
            {canShowActiveThread ? (
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
                      currentUserId={currentUserId!}
                      loading={loading}
                      isGroupThread
                      bannerNotice={
                        activeGroup.isMember === false
                          ? "Solo ves mensajes hasta que saliste del grupo."
                          : null
                      }
                      showBackButton
                      onBack={() => { setMobileShowThread(false); }}
                      headerAction={
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { setGroupInfoOpen(true); }}
                          >
                            Info
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => { setLeaveConfirmOpen(true); }}
                          >
                            Salir
                          </Button>
                        </div>
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
                  ) : (
                    <div className="border-t border-(--security-border) bg-(--security-surface) px-4 py-3 text-sm text-amber-700">
                      {hasDriverProfile === false ? (
                        <>
                          Solo conductores con rol habilitado pueden enviar
                          mensajes al grupo.{" "}
                          <Link to="/app/support/pqrs" className="underline">
                            Contacta al soporte técnico
                          </Link>
                          .
                        </>
                      ) : (
                        "Solo los miembros del grupo pueden enviar mensajes."
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <ChatThread
                      title={activeContact?.name ?? activeChat?.title ?? "Chat directo"}
                      subtitle={activeContact?.email}
                      messages={threadMessages}
                      currentUserId={currentUserId!}
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
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-(--security-surface) p-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <MessageCircle className="size-8" aria-hidden />
                </div>
                <div>
                  <p className="font-medium">Selecciona un chat</p>
                  <p className="text-sm text-muted-foreground">
                    {hasCitizenProfile === true
                      ? "Inicia un chat directo, explora grupos públicos o crea un grupo."
                      : "Inicia un chat directo. Para crear o unirte a grupos necesitas un perfil de ciudadano."}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button type="button" onClick={() => { setNewChatOpen(true); }}>
                    <MessageSquarePlus className="size-4" />
                    Nuevo chat
                  </Button>
                  {hasCitizenProfile === true ? (
                    <>
                      <Button type="button" variant="outline" onClick={() => { setPublicGroupsOpen(true); }}>
                        <Compass className="size-4" />
                        Explorar grupos
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setCreateGroupOpen(true); }}>
                        <Users className="size-4" />
                        Crear grupo
                      </Button>
                    </>
                  ) : null}
                  {hasDriverProfile === true ? (
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
        currentUser={
          currentUser
            ? { id: currentUser.id, email: currentUser.email }
            : undefined
        }
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

      <PublicGroupsDialog
        open={publicGroupsOpen}
        onOpenChange={setPublicGroupsOpen}
        loading={loading}
        hasCitizenProfile={hasCitizenProfile}
        onJoin={(groupId) => joinPublicGroup(groupId)}
        onOpenChat={(group) => { void openGroupChat(group); }}
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
              myRole={getMyRole(activeGroup, currentUserId)}
              isAdmin={isGroupAdmin(activeGroup, currentUserId)}
              isMember={isGroupMember(activeGroup, currentUserId)}
              loading={loading}
              hasCitizenProfile={hasCitizenProfile}
              searchResults={searchResults}
              members={members}
              membersLoading={membersLoading}
              membershipLog={membershipLog}
              membershipLogLoading={membershipLogLoading}
              onJoin={async () => {
                const group = await joinPublicGroup(activeGroup.id);
                if (group) {
                  await openGroupChat(group);
                  setGroupInfoOpen(false);
                }
              }}
              onInvite={async (memberIds) => {
                await inviteMembers(activeGroup.id, memberIds);
                await fetchGroupById(activeGroup.id, true);
              }}
              onUpdateIcon={async (iconUrl) => {
                await changeGroupIcon(activeGroup.id, iconUrl);
                await fetchGroupById(activeGroup.id, true);
              }}
              onSearch={searchPeople}
              onLoadMembers={loadGroupMembers}
              onPromoteMember={promoteMember}
              onDemoteMember={demoteMember}
              onRemoveMember={removeMember}
              onLoadMembershipLog={loadMembershipLog}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {activeGroup ? (
        <Dialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abandonar grupo</DialogTitle>
              <DialogDescription>
                ¿Seguro que deseas abandonar &quot;{activeGroup.name}&quot;? Dejarás de recibir sus mensajes y notificaciones.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setLeaveConfirmOpen(false); }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={async () => {
                  const ok = await leaveGroup(activeGroup.id);
                  if (ok) {
                    setLeaveConfirmOpen(false);
                    setGroupInfoOpen(false);
                    setActiveConversationId(null);
                    setMobileShowThread(false);
                    await loadGroups(hasDriverProfile === true);
                  }
                }}
              >
                {loading ? "Saliendo..." : "Abandonar grupo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </PageShell>
  );
}
