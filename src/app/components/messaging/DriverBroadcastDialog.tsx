import { useMemo, useState } from "react";
import { Megaphone } from "lucide-react";

import type { MessageGroup } from "@/core/types/messaging";
import { ChatComposer } from "./ChatComposer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DriverBroadcastDialogProps {
  open: boolean;
  loading: boolean;
  groups: MessageGroup[];
  maxBodyLength: number;
  onOpenChange: (open: boolean) => void;
  onSend: (payload: {
    groupIds: string[];
    body: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<boolean>;
}

export function DriverBroadcastDialog({
  open,
  loading,
  groups,
  maxBodyLength,
  onOpenChange,
  onSend,
}: DriverBroadcastDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups],
  );

  const toggleGroup = (groupId: string) => {
    setSelectedIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const handleSend = async (payload: {
    body: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (selectedIds.length === 0) return false;
    const sent = await onSend({
      groupIds: selectedIds,
      body: payload.body,
      latitude: payload.latitude,
      longitude: payload.longitude,
    });
    if (sent) {
      setSelectedIds([]);
      onOpenChange(false);
    }
    return sent;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelectedIds([]);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="size-5" />
            Aviso a grupos
          </DialogTitle>
          <DialogDescription>
            HU-ENTR-3-005: envía un mensaje a uno o varios grupos donde eres miembro.
          </DialogDescription>
        </DialogHeader>

        {sortedGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tienes grupos asignados. Un administrador debe agregarte con POST /groups/:id/members.
          </p>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="max-h-48 rounded-lg border p-2">
              <div className="space-y-2">
                {sortedGroups.map((group) => (
                  <label
                    key={group.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedIds.includes(group.id)}
                      onCheckedChange={() => { toggleGroup(group.id); }}
                    />
                    <div>
                      <p className="font-medium">{group.name}</p>
                      {group.description ? (
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              {selectedIds.length} grupo(s) seleccionado(s)
            </p>

            <ChatComposer
              loading={loading}
              maxBodyLength={maxBodyLength}
              disabled={selectedIds.length === 0}
              onSend={handleSend}
            />
          </div>
        )}

        <Button type="button" variant="outline" onClick={() => { onOpenChange(false); }}>
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
