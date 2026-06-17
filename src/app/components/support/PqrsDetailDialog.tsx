import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, MessageSquarePlus } from "lucide-react";

import type { CreatePqrsUpdateRequest, Pqrs, PqrsStatus, PqrsUpdate } from "@/core/types/pqrs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PqrsStatusBadge, statusLabels } from "./PqrsStatusBadge";

interface PqrsDetailDialogProps {
  pqrs: Pqrs | null;
  updates: PqrsUpdate[];
  updatesLoading: boolean;
  savingUpdate: boolean;
  open: boolean;
  onClose: () => void;
  onLoadUpdates: (pqrsId: string) => void;
  onAddUpdate: (pqrsId: string, payload: CreatePqrsUpdateRequest) => Promise<boolean>;
}

function formatDate(value: string) {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: es });
  } catch {
    return value;
  }
}

const pqrsStatuses: PqrsStatus[] = ["received", "in_review", "in_progress", "resolved"];

export function PqrsDetailDialog({
  pqrs,
  updates,
  updatesLoading,
  savingUpdate,
  open,
  onClose,
  onLoadUpdates,
  onAddUpdate,
}: PqrsDetailDialogProps) {
  const [statusTo, setStatusTo] = useState<PqrsStatus>("in_review");
  const [description, setDescription] = useState("");
  const [agentResponse, setAgentResponse] = useState("");

  useEffect(() => {
    if (pqrs && open) {
      onLoadUpdates(pqrs.id);
    }
  }, [pqrs, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pqrs) return;
    const ok = await onAddUpdate(pqrs.id, {
      status_to: statusTo,
      description,
      agent_response: agentResponse,
    });
    if (ok) {
      setDescription("");
      setAgentResponse("");
    }
  };

  if (!pqrs) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>PQRS #{pqrs.ticket_number}</span>
            <PqrsStatusBadge status={pqrs.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 text-sm">
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3">
            <div>
              <span className="text-xs text-muted-foreground">Usuario</span>
              <p className="font-medium truncate">{pqrs.user_email}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Creada</span>
              <p>{formatDate(pqrs.created_at)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Descripción</span>
              <p className="whitespace-pre-wrap">{pqrs.description || "—"}</p>
            </div>
            {pqrs.images?.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Adjuntos</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {pqrs.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline"
                    >
                      {img.original_name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Historial de seguimientos
            </p>
            <ScrollArea className="h-40 rounded-lg border">
              {updatesLoading ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Cargando...</p>
              ) : updates.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Sin seguimientos.</p>
              ) : (
                <div className="divide-y">
                  {updates.map((u) => (
                    <div key={u.id} className="px-3 py-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(u.created_at)}</span>
                        {u.status_from && u.status_to && (
                          <>
                            <span className="font-medium text-foreground">
                              {statusLabels[u.status_from]}
                            </span>
                            <ArrowRight className="size-3" />
                            <span className="font-medium text-foreground">
                              {statusLabels[u.status_to]}
                            </span>
                          </>
                        )}
                      </div>
                      {u.description && (
                        <p className="mt-1 text-sm">{u.description}</p>
                      )}
                      {u.agent_response && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          Respuesta: {u.agent_response}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-3 rounded-lg border p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageSquarePlus className="size-4" />
              Registrar seguimiento
            </p>
            <div className="space-y-1">
              <Label className="text-xs">Cambiar estado a</Label>
              <Select
                value={statusTo}
                onValueChange={(v) => { setStatusTo(v as PqrsStatus); }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pqrsStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nota interna</Label>
              <Textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); }}
                placeholder="Descripción del seguimiento..."
                rows={2}
                className="text-sm"
                maxLength={1000}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Respuesta al ciudadano</Label>
              <Textarea
                value={agentResponse}
                onChange={(e) => { setAgentResponse(e.target.value); }}
                placeholder="Mensaje de respuesta para el ciudadano..."
                rows={2}
                className="text-sm"
                maxLength={2000}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={savingUpdate}>
                {savingUpdate ? "Guardando..." : "Guardar seguimiento"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
