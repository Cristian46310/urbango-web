import { useCallback, useState } from "react";

import type {
  CreateGroupPayload,
  GroupDetail,
  GroupMemberDetail,
  GroupMemberRole,
  JoinGroupResponse,
  MembershipLogEntry,
  MessageGroup,
  UserSearchResult,
} from "@/core/types/messaging";
import { groupToConversationMeta } from "@/lib/messaging/chatUtils";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  addGroupMembers,
  createGroup,
  getGroupById,
  getGroupMembers,
  getGroupMembershipLog,
  getGroups,
  getMyDriverGroups,
  joinGroup,
  leaveGroup as leaveGroupService,
  removeGroupMember,
  updateGroupIcon,
  updateGroupMemberRole,
} from "@/services/groupService";

function mergeGroupLists(groups: MessageGroup[]): MessageGroup[] {
  const map = new Map<string, MessageGroup>();

  for (const group of groups) {
    const existing = map.get(group.id);
    if (!existing) {
      map.set(group.id, group);
      continue;
    }

    const existingCount = existing.members?.length ?? existing.memberCount ?? 0;
    const nextCount = group.members?.length ?? group.memberCount ?? 0;
    const preferred = nextCount > existingCount ? group : existing;
    const mergedCount = Math.max(existingCount, nextCount);

    map.set(group.id, {
      ...preferred,
      ...group,
      memberCount: mergedCount,
    });
  }

  return Array.from(map.values());
}

function mergeGroupIntoList(prev: MessageGroup[], group: MessageGroup): MessageGroup[] {
  const filtered = prev.filter((item) => item.id !== group.id);
  return [group, ...filtered];
}

export function getMyRole(
  group: MessageGroup | null,
  userId: string | undefined,
): GroupMemberRole | undefined {
  if (!group || !userId) return undefined;
  if (group.myRole) return group.myRole;
  return group.members?.find((member) => member.userId === userId)?.role;
}

export function useGroups() {
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMemberDetail[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membershipLog, setMembershipLog] = useState<MembershipLogEntry[]>([]);
  const [membershipLogLoading, setMembershipLogLoading] = useState(false);

  const loadGroups = useCallback(async (includeDriverGroups = false, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const page = await getGroups(1, 50);
      let merged = page.items;

      if (includeDriverGroups) {
        try {
          const driverPage = await getMyDriverGroups(1, 50);
          merged = mergeGroupLists([...merged, ...driverPage.items]);
        } catch {
          // El conductor puede no tener grupos asignados aún
        }
      }

      setGroups(merged);
      return merged;
    } catch (err) {
      if (!silent) {
        const message = getApiErrorMessage(err, "No se pudieron cargar los grupos");
        setError(message);
      }
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const fetchGroupById = useCallback(async (groupId: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const detail = await getGroupById(groupId);
      setGroups((prev) => mergeGroupIntoList(prev, detail));
      return detail;
    } catch (err) {
      if (!silent) {
        const message = getApiErrorMessage(err, "No se pudo cargar el grupo");
        setError(message);
      }
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const createNewGroup = useCallback(async (payload: CreateGroupPayload) => {
    setLoading(true);
    setError(null);
    try {
      const group = await createGroup(payload);
      setGroups((prev) => mergeGroupIntoList(prev, group));
      showSuccessToast("Grupo creado correctamente");
      return group;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudo crear el grupo");
      setError(message);
      showErrorToast(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinPublicGroup = useCallback(
    async (groupId: string, options?: { skipToast?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const response: JoinGroupResponse = await joinGroup(groupId);
        const group: MessageGroup = {
          ...response,
          isMember: true,
          myRole: response.myRole ?? "member",
        };
        setGroups((prev) => mergeGroupIntoList(prev, group));
        if (!options?.skipToast) {
          showSuccessToast(response.welcomeMessage ?? "Te uniste al grupo");
        }
        return group;
      } catch (err) {
        const message = getApiErrorMessage(err, "No se pudo unir al grupo");
        setError(message);
        showErrorToast(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const removeGroupLocally = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((item) => item.id !== groupId));
  }, []);

  const leaveGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      await leaveGroupService(groupId);
      setGroups((prev) => prev.filter((item) => item.id !== groupId));
      showSuccessToast("Abandonaste el grupo");
      return true;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudo abandonar el grupo");
      setError(message);
      showErrorToast(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const inviteMembers = useCallback(async (groupId: string, memberIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const group = await addGroupMembers(groupId, { memberIds });
      setGroups((prev) => mergeGroupIntoList(prev, group));
      showSuccessToast("Miembros agregados al grupo");
      return group;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudieron agregar miembros");
      setError(message);
      showErrorToast(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const changeGroupIcon = useCallback(async (groupId: string, iconUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const group = await updateGroupIcon(groupId, { iconUrl });
      setGroups((prev) => mergeGroupIntoList(prev, group));
      showSuccessToast("Ícono del grupo actualizado");
      return group;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudo actualizar el ícono");
      setError(message);
      showErrorToast(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGroupMembers = useCallback(async (groupId: string, q?: string, silent = false) => {
    if (!silent) {
      setMembersLoading(true);
    }
    try {
      const page = await getGroupMembers(groupId, q, 1, 100);
      setMembers(page.items);
      return page.items;
    } catch (err) {
      if (!silent) {
        showErrorToast(getApiErrorMessage(err, "No se pudieron cargar los miembros"));
      }
      return [];
    } finally {
      if (!silent) {
        setMembersLoading(false);
      }
    }
  }, []);

  const loadMembershipLog = useCallback(async (groupId: string, silent = false) => {
    if (!silent) {
      setMembershipLogLoading(true);
    }
    try {
      const page = await getGroupMembershipLog(groupId, 1, 100);
      setMembershipLog(page.items);
      return page.items;
    } catch (err) {
      if (!silent) {
        showErrorToast(getApiErrorMessage(err, "No se pudo cargar el historial"));
      }
      return [];
    } finally {
      if (!silent) {
        setMembershipLogLoading(false);
      }
    }
  }, []);

  const promoteMember = useCallback(async (groupId: string, userId: string) => {
    setMembersLoading(true);
    try {
      await updateGroupMemberRole(groupId, userId, "admin");
      setMembers((prev) =>
        prev.map((member) =>
          member.userId === userId ? { ...member, role: "admin" } : member,
        ),
      );
      void loadMembershipLog(groupId, true);
      showSuccessToast("Miembro promovido a administrador");
      return true;
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo promover al miembro"));
      return false;
    } finally {
      setMembersLoading(false);
    }
  }, [loadMembershipLog]);

  const demoteMember = useCallback(async (groupId: string, userId: string) => {
    setMembersLoading(true);
    try {
      await updateGroupMemberRole(groupId, userId, "member");
      setMembers((prev) =>
        prev.map((member) =>
          member.userId === userId ? { ...member, role: "member" } : member,
        ),
      );
      void loadMembershipLog(groupId, true);
      showSuccessToast("Administrador degradado a miembro");
      return true;
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo degradar al miembro"));
      return false;
    } finally {
      setMembersLoading(false);
    }
  }, [loadMembershipLog]);

  const removeMember = useCallback(async (groupId: string, userId: string, block = false) => {
    setMembersLoading(true);
    try {
      await removeGroupMember(groupId, userId, block);
      setMembers((prev) => prev.filter((member) => member.userId !== userId));
      void loadMembershipLog(groupId, true);
      showSuccessToast(block ? "Miembro removido y bloqueado" : "Miembro removido del grupo");
      return true;
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo remover al miembro"));
      return false;
    } finally {
      setMembersLoading(false);
    }
  }, [loadMembershipLog]);

  const upsertGroup = useCallback((group: MessageGroup) => {
    setGroups((prev) => mergeGroupIntoList(prev, group));
  }, []);

  const getGroupConversationMeta = useCallback(() => {
    const meta: Record<string, ReturnType<typeof groupToConversationMeta>> = {};
    for (const group of groups) {
      meta[group.conversationId] = groupToConversationMeta(group);
    }
    return meta;
  }, [groups]);

  const findGroupByConversationId = useCallback(
    (conversationId: string) =>
      groups.find((group) => group.conversationId === conversationId) ?? null,
    [groups],
  );

  const isGroupAdmin = useCallback(
    (group: MessageGroup | null, userId: string | undefined) => {
      return getMyRole(group, userId) === "admin";
    },
    [],
  );

  const isGroupMember = useCallback(
    (group: MessageGroup | null, userId: string | undefined) => {
      if (!group || !userId) return false;
      if (group.isMember === true) return true;
      if (group.isMember === false) return false;
      return group.members?.some((member) => member.userId === userId) ?? false;
    },
    [],
  );

  return {
    groups,
    loading,
    error,
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
    getGroupConversationMeta,
    findGroupByConversationId,
    isGroupAdmin,
    isGroupMember,
    getMyRole,
  };
}

export type { UserSearchResult, GroupDetail };
