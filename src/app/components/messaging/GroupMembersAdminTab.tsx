import { useEffect, useState } from "react";
import { Ban, Shield, ShieldOff, UserMinus } from "lucide-react";

import type { GroupMemberDetail } from "@/core/types/messaging";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GroupMembersAdminTabProps {
  groupId: string;
  currentUserId?: string;
  members: GroupMemberDetail[];
  loading: boolean;
  onLoadMembers: (groupId: string, q?: string) => Promise<GroupMemberDetail[]>;
  onPromote: (groupId: string, userId: string) => Promise<boolean>;
  onDemote: (groupId: string, userId: string) => Promise<boolean>;
  onRemove: (groupId: string, userId: string, block?: boolean) => Promise<boolean>;
}

type PendingAction =
  | { type: "remove"; userId: string; name: string }
  | { type: "block"; userId: string; name: string };

export function GroupMembersAdminTab({
  groupId,
  currentUserId,
  members,
  loading,
  onLoadMembers,
  onPromote,
  onDemote,
  onRemove,
}: GroupMembersAdminTabProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => { window.clearTimeout(timeout); };
  }, [query]);

  useEffect(() => {
    void onLoadMembers(groupId, debouncedQuery || undefined);
  }, [groupId, debouncedQuery, onLoadMembers]);

  const adminCount = members.filter((member) => member.role === "admin").length;
  const isOnlyAdmin = (member: GroupMemberDetail) =>
    member.role === "admin" && adminCount <= 1;

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const ok =
      pendingAction.type === "block"
        ? await onRemove(groupId, pendingAction.userId, true)
        : await onRemove(groupId, pendingAction.userId, false);
    if (ok) {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); }}
        placeholder="Buscar miembros..."
      />

      <ScrollArea className="h-[320px] pr-3">
        {loading && members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cargando miembros...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay miembros que coincidan.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {members.map((member) => {
              const displayName = member.name ?? member.email ?? member.userId;
              const isSelf = member.userId === currentUserId;
              const cannotModify = isSelf && isOnlyAdmin(member);

              const actions = [];

              if (member.role === "member") {
                actions.push({
                  label: "Promover a admin",
                  icon: Shield,
                  onClick: () => { void onPromote(groupId, member.userId); },
                });
              } else {
                actions.push({
                  label: "Degradar a miembro",
                  icon: ShieldOff,
                  onClick: () => { void onDemote(groupId, member.userId); },
                  variant: "default" as const,
                });
              }

              if (!isSelf) {
                actions.push({
                  label: "Remover",
                  icon: UserMinus,
                  onClick: () => {
                    setPendingAction({ type: "remove", userId: member.userId, name: displayName });
                  },
                  variant: "destructive" as const,
                });
                actions.push({
                  label: "Remover y bloquear",
                  icon: Ban,
                  onClick: () => {
                    setPendingAction({ type: "block", userId: member.userId, name: displayName });
                  },
                  variant: "destructive" as const,
                });
              }

              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{displayName}</p>
                    {member.email ? (
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role === "admin" ? "Admin" : "Miembro"}
                    </Badge>
                    {!cannotModify && actions.length > 0 ? (
                      <RowActionsDropdown actions={actions} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <Dialog open={pendingAction !== null} onOpenChange={(open) => { if (!open) setPendingAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.type === "block" ? "Remover y bloquear" : "Remover miembro"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.type === "block"
                ? `¿Remover a "${pendingAction.name}" y bloquear que vuelva a unirse al grupo?`
                : `¿Remover a "${pendingAction?.name}" del grupo?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setPendingAction(null); }}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={() => { void handleConfirmAction(); }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
