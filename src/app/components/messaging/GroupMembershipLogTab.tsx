import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

import type { MembershipLogEntry } from "@/core/types/messaging";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GroupMembershipLogTabProps {
  groupId: string;
  entries: MembershipLogEntry[];
  loading: boolean;
  onLoadLog: (groupId: string) => Promise<MembershipLogEntry[]>;
}

function formatDate(value: string) {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: es });
  } catch {
    return value;
  }
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    joined: "Se unió al grupo",
    left: "Abandonó el grupo",
    removed: "Fue removido",
    blocked: "Fue removido y bloqueado",
    promoted: "Fue promovido a admin",
    demoted: "Fue degradado a miembro",
    invited: "Fue invitado",
  };
  return labels[action] ?? action;
}

function describeEntry(entry: MembershipLogEntry) {
  const actor = entry.actorName ?? entry.actorUserId;
  const target = entry.targetName ?? entry.targetUserId;

  switch (entry.action) {
    case "joined":
      return target ? `${target} se unió al grupo` : actionLabel(entry.action);
    case "left":
      return target ? `${target} abandonó el grupo` : actionLabel(entry.action);
    case "removed":
    case "blocked":
      return actor && target
        ? `${actor} removió a ${target}${entry.action === "blocked" ? " (bloqueado)" : ""}`
        : actionLabel(entry.action);
    case "promoted":
    case "demoted":
      return actor && target
        ? `${actor} cambió el rol de ${target}`
        : actionLabel(entry.action);
    case "invited":
      return actor && target
        ? `${actor} invitó a ${target}`
        : actionLabel(entry.action);
    default:
      return actionLabel(entry.action);
  }
}

export function GroupMembershipLogTab({
  groupId,
  entries,
  loading,
  onLoadLog,
}: GroupMembershipLogTabProps) {
  useEffect(() => {
    void onLoadLog(groupId);
  }, [groupId, onLoadLog]);

  return (
    <ScrollArea className="h-[360px] pr-3">
      {loading && entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Cargando actividad...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay eventos registrados aún.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{describeEntry(entry)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
