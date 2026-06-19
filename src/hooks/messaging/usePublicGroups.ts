import { useCallback, useEffect, useState } from "react";

import type { GroupDetail, MessageGroup } from "@/core/types/messaging";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast } from "@/lib/toast";
import { getGroupById, getPublicGroups } from "@/services/groupService";

export function usePublicGroups() {
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => { window.clearTimeout(timeout); };
  }, [query]);

  const searchPublicGroups = useCallback(async (q = debouncedQuery, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const page = await getPublicGroups(q, 1, 50);
      setGroups(page.items);
      return page.items;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudieron cargar los grupos públicos");
      setError(message);
      if (!silent) {
        showErrorToast(message);
      }
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [debouncedQuery]);

  useEffect(() => {
    void searchPublicGroups(debouncedQuery);
  }, [debouncedQuery, searchPublicGroups]);

  const loadGroupDetail = useCallback(async (groupId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await getGroupById(groupId);
      setSelectedDetail(detail);
      return detail;
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudo cargar el grupo");
      setError(message);
      showErrorToast(message);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDetail(null);
  }, []);

  const reset = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setSelectedDetail(null);
    setError(null);
  }, []);

  return {
    groups,
    selectedDetail,
    loading,
    detailLoading,
    error,
    query,
    setQuery,
    searchPublicGroups,
    loadGroupDetail,
    clearSelection,
    reset,
  };
}
