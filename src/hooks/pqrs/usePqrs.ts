import { useCallback, useEffect, useState } from "react";

import type { CreatePqrsRequest, Pqrs } from "@/core/types/pqrs";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { createPqrs, getPqrsByTicket, listPqrs } from "@/services/pqrsService";

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
      setMyPqrs(data);
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudieron cargar tus PQRS"));
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const create = useCallback(
    async (payload: CreatePqrsRequest): Promise<Pqrs | null> => {
      setCreating(true);
      try {
        const pqrs = await createPqrs(payload);
        setMyPqrs((prev) => [pqrs, ...prev]);
        showSuccessToast(`PQRS creada. Ticket: ${pqrs.ticket_number}`);
        return pqrs;
      } catch (err) {
        showErrorToast(getApiErrorMessage(err, "No se pudo crear la PQRS"));
        return null;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  const searchByTicket = useCallback(async (ticketNumber: string): Promise<void> => {
    setTicketLoading(true);
    setTicketResult(null);
    try {
      const pqrs = await getPqrsByTicket(ticketNumber);
      setTicketResult(pqrs);
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se encontró la PQRS con ese ticket"));
    } finally {
      setTicketLoading(false);
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
    clearTicketResult: () => { setTicketResult(null); },
  };
}
