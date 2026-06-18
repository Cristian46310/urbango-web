import { useCallback, useState } from "react";

import type {
  CreateGroupPayload,
  MessageGroup,
  UserSearchResult,
} from "@/core/types/messaging";
import { groupToConversationMeta } from "@/lib/messaging/chatUtils";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  addGroupMembers,
  createGroup,
  getGroups,
  getMyDriverGroups,
  joinGroup,
  leaveGroup as leaveGroupService,
  updateGroupIcon,
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
      memberCount: mergedCount,
    });
  }

  return Array.from(map.values());
}

export function useGroups() {
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        showErrorToast(message);
      }
      return [];
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
      setGroups((prev) => {
        const filtered = prev.filter((item) => item.id !== group.id);
        return [group, ...filtered];
      });
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

  const joinPublicGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      const group = await joinGroup(groupId);
      setGroups((prev) => prev.map((item) => (item.id === group.id ? group : item)));
      showSuccessToast("Te uniste al grupo");
      return group;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudo unir al grupo");
      setError(message);
      showErrorToast(message);
      return null;
    } finally {
      setLoading(false);
    }
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
      setGroups((prev) => prev.map((item) => (item.id === group.id ? group : item)));
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
      setGroups((prev) => prev.map((item) => (item.id === group.id ? group : item)));
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

  const upsertGroup = useCallback((group: MessageGroup) => {
    setGroups((prev) => {
      const filtered = prev.filter((item) => item.id !== group.id);
      return [group, ...filtered];
    });
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
      if (!group || !userId) return false;
      return group.members?.some(
        (member) => member.userId === userId && member.role === "admin",
      ) ?? false;
    },
    [],
  );

  const isGroupMember = useCallback(
    (group: MessageGroup | null, userId: string | undefined) => {
      if (!group || !userId) return false;
      return group.members?.some((member) => member.userId === userId) ?? false;
    },
    [],
  );

  return {
    groups,
    loading,
    error,
    loadGroups,
    createNewGroup,
    joinPublicGroup,
    leaveGroup,
    inviteMembers,
    changeGroupIcon,
    upsertGroup,
    getGroupConversationMeta,
    findGroupByConversationId,
    isGroupAdmin,
    isGroupMember,
  };
}

export type { UserSearchResult };
