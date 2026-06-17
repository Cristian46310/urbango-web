import { useCallback, useEffect, useState } from "react";

import type {
  CreatePqrsUpdateRequest,
  ListPqrsQuery,
  Pqrs,
  PqrsUpdate,
} from "@/core/types/pqrs";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  createPqrsUpdate,
  deletePqrs,
  listPqrs,
  listPqrsUpdates,
} from "@/services/pqrsService";

export function usePqrsAdmin() {
  const [pqrsList, setPqrsList] = useState<Pqrs[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatesMap, setUpdatesMap] = useState<Record<string, PqrsUpdate[]>>({});
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [filters, setFilters] = useState<ListPqrsQuery>({});

  const load = useCallback(async (query?: ListPqrsQuery) => {
    setLoading(true);
    try {
      const data = await listPqrs(query ?? filters);
      setPqrsList(data);
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudieron cargar las PQRS"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const applyFilters = useCallback((query: ListPqrsQuery) => {
    setFilters(query);
  }, []);

  const loadUpdates = useCallback(async (pqrsId: string) => {
    setUpdatesLoading(true);
    try {
      const updates = await listPqrsUpdates(pqrsId);
      setUpdatesMap((prev) => ({ ...prev, [pqrsId]: updates }));
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudieron cargar los seguimientos"));
    } finally {
      setUpdatesLoading(false);
    }
  }, []);

  const addUpdate = useCallback(
    async (pqrsId: string, payload: CreatePqrsUpdateRequest): Promise<boolean> => {
      setSavingUpdate(true);
      try {
        const update = await createPqrsUpdate(pqrsId, payload);
        setUpdatesMap((prev) => ({
          ...prev,
          [pqrsId]: [...(prev[pqrsId] ?? []), update],
        }));
        setPqrsList((prev) =>
          prev.map((p) =>
            p.id === pqrsId ? { ...p, status: payload.status_to } : p,
          ),
        );
        showSuccessToast("Seguimiento registrado");
        return true;
      } catch (err) {
        showErrorToast(getApiErrorMessage(err, "No se pudo registrar el seguimiento"));
        return false;
      } finally {
        setSavingUpdate(false);
      }
    },
    [],
  );

  const remove = useCallback(async (pqrsId: string): Promise<boolean> => {
    try {
      await deletePqrs(pqrsId);
      setPqrsList((prev) => prev.filter((p) => p.id !== pqrsId));
      showSuccessToast("PQRS eliminada");
      return true;
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo eliminar la PQRS"));
      return false;
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    pqrsList,
    loading,
    updatesMap,
    updatesLoading,
    savingUpdate,
    filters,
    load,
    applyFilters,
    loadUpdates,
    addUpdate,
    remove,
  };
}
