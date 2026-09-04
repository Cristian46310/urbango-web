import { useCallback, useEffect, useState } from "react";

import type { CreatePqrsInput, Pqrs } from "@/core/types/pqrs";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { createPqrs, getPqrs, getPqrsByTicket, listPqrs } from "@/services/pqrsService";

export function usePqrs(userEmail: string | null) {
  const [myPqrs, setMyPqrs] = useState<Pqrs[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [ticketResult, setTicketResult] = useState<Pqrs | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  const loadMyPqrs = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const data = await listPqrs({ user_email: userEmail });
      setMyPqrs(Array.isArray(data) ? data : []);
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "No se pudieron cargar tus PQRS",
      );
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const create = useCallback(
    async (input: CreatePqrsInput): Promise<Pqrs | null> => {
      setCreating(true);
      try {
        const pqrs = await createPqrs(input);
        setMyPqrs((prev) => [pqrs, ...prev.filter((p) => p.id !== pqrs.id)]);
        showSuccessToast(`PQRS creada. Ticket: ${pqrs.ticket_number}`);
        // Refresco completo por si el backend enriquece campos (categoría IA, etc.)
        void loadMyPqrs();
        return pqrs;
      } catch (err) {
        showErrorToast(
          err instanceof Error ? err.message : "No se pudo crear la PQRS",
        );
        return null;
      } finally {
        setCreating(false);
      }
    },
    [loadMyPqrs],
  );

  const searchByTicket = useCallback(async (ticketNumber: string): Promise<Pqrs | null> => {
    setTicketLoading(true);
    setTicketResult(null);
    try {
      const pqrs = await getPqrsByTicket(ticketNumber);
      setTicketResult(pqrs);
      return pqrs;
    } catch (err) {
      showErrorToast(
        err instanceof Error
          ? err.message
          : "No se encontró la PQRS con ese ticket",
      );
      return null;
    } finally {
      setTicketLoading(false);
    }
  }, []);

  const loadById = useCallback(async (pqrsId: string): Promise<Pqrs | null> => {
    try {
      return await getPqrs(pqrsId);
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "No se pudo cargar el detalle de la PQRS",
      );
      return null;
    }
  }, []);

  useEffect(() => {
    void loadMyPqrs();
  }, [loadMyPqrs]);

  return {
    myPqrs,
    loading,
    creating,
    ticketResult,
    ticketLoading,
    loadMyPqrs,
    create,
    searchByTicket,
    loadById,
    clearTicketResult: () => {
      setTicketResult(null);
    },
  };
}
