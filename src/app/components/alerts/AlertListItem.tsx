import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Bell } from "lucide-react";

import type { UserAlert } from "@/core/types/alerts";
import { cn } from "@/lib/utils";

interface AlertListItemProps {
  alert: UserAlert;
  active: boolean;
  onSelect: (alertId: string) => void;
}

function formatAlertTime(value: string) {
  try {
    return format(new Date(value), "dd MMM HH:mm", { locale: es });
  } catch {
    return "";
  }
}

const scopeLabels: Record<UserAlert["scope"], string> = {
  all: "Todos",
  route: "Por ruta",
  zone: "Por zona",
};

export function AlertListItem({ alert, active, onSelect }: AlertListItemProps) {
  return (
    <button
      type="button"
      onClick={() => { onSelect(alert.id); }}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60",
        active && "bg-accent",
        !alert.isRead && "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          alert.isUrgent ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary",
        )}
      >
        {alert.isUrgent ? <AlertTriangle className="size-5" /> : <Bell className="size-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("truncate font-medium", !alert.isRead && "font-semibold")}>
            {alert.title}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatAlertTime(alert.sentAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{alert.body}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{scopeLabels[alert.scope]}</span>
          {alert.isUrgent ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive">
              Urgente
            </span>
          ) : null}
          {!alert.isRead ? (
            <span className="size-2 rounded-full bg-primary" aria-label="No leída" />
          ) : null}
        </div>
      </div>
    </button>
  );
}
