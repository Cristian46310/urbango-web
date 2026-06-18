import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { ContactInfo, MessageReadEntry, MessageReadsResponse } from "@/core/types/messaging";
import { getContactLabel } from "@/lib/messaging/chatUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MessageReadsDialogProps {
  open: boolean;
  loading: boolean;
  messagePreview?: string;
  reads: MessageReadEntry[];
  totalMembers?: number;
  readCount?: number;
  contacts?: Record<string, ContactInfo>;
  onOpenChange: (open: boolean) => void;
}

function formatReadTime(value: string) {
  try {
    return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: es });
  } catch {
    return value;
  }
}

export function MessageReadsDialog({
  open,
  loading,
  messagePreview,
  reads,
  totalMembers,
  readCount,
  contacts = {},
  onOpenChange,
}: MessageReadsDialogProps) {
  const effectiveReadCount = readCount ?? reads.length;
  const effectiveTotal = totalMembers ?? effectiveReadCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quién leyó el mensaje</DialogTitle>
          <DialogDescription>
            {messagePreview
              ? `"${messagePreview.slice(0, 80)}${messagePreview.length > 80 ? "…" : ""}"`
              : null}
          </DialogDescription>
        </DialogHeader>

        {!loading && effectiveTotal > 0 ? (
          <p className="text-sm text-muted-foreground">
            {effectiveReadCount} de {effectiveTotal} miembros han leído este mensaje.
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando lecturas...</p>
        ) : reads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nadie ha leído este mensaje aún.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {reads.map((read) => (
              <li key={`${read.userId}-${read.readAt}`} className="rounded-md border px-3 py-2">
                <p className="font-medium">{getContactLabel(contacts[read.userId], read.userId)}</p>
                <p className="text-xs text-muted-foreground">{formatReadTime(read.readAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function useMessageReadsDialog(
  fetchReads: (messageId: string) => Promise<MessageReadsResponse | null>,
  resolveContacts?: (userIds: string[]) => void,
) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reads, setReads] = useState<MessageReadEntry[]>([]);
  const [totalMembers, setTotalMembers] = useState<number>();
  const [readCount, setReadCount] = useState<number>();
  const [messagePreview, setMessagePreview] = useState<string>();

  const showReads = async (messageId: string, preview?: string) => {
    setOpen(true);
    setMessagePreview(preview);
    setLoading(true);
    try {
      const response = await fetchReads(messageId);
      const entries = response?.readBy ?? [];
      setReads(entries);
      setTotalMembers(response?.totalMembers);
      setReadCount(response?.readCount ?? entries.length);
      resolveContacts?.(entries.map((entry) => entry.userId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setReads([]);
      setTotalMembers(undefined);
      setReadCount(undefined);
      setMessagePreview(undefined);
    }
  }, [open]);

  return {
    open,
    loading,
    reads,
    totalMembers,
    readCount,
    messagePreview,
    setOpen,
    showReads,
  };
}
