import { AlertTriangle } from "lucide-react";

import type { UserAlert } from "@/core/types/alerts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UrgentAlertDialogProps {
  alert: UserAlert | null;
  onOpenChange: (open: boolean) => void;
  onView: (alertId: string) => void;
}

export function UrgentAlertDialog({ alert, onOpenChange, onView }: UrgentAlertDialogProps) {
  return (
    <Dialog open={Boolean(alert)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Alerta urgente
          </DialogTitle>
          <DialogDescription>
            {alert?.senderName ? `De: ${alert.senderName}` : "Nueva alerta del sistema"}
          </DialogDescription>
        </DialogHeader>

        {alert ? (
          <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="font-semibold">{alert.title}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{alert.body}</p>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => { onOpenChange(false); }}>
            Cerrar
          </Button>
          {alert ? (
            <Button
              type="button"
              onClick={() => {
                onView(alert.id);
                onOpenChange(false);
              }}
            >
              Ver alerta
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
