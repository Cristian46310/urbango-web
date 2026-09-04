import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type CrudDialogMode = "create" | "edit" | "view";

interface CrudDialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  mode: CrudDialogMode;
  children: ReactNode;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  closeLabel?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  /** When false, hides the primary save action (e.g. edit with no changes). */
  showSave?: boolean;
  /** Extra classes for DialogContent (e.g. wider modals with maps). */
  contentClassName?: string;
}

export function CrudDialogShell({
  open,
  onOpenChange,
  title,
  description,
  mode,
  children,
  onClose,
  onSave,
  saveLabel = "Guardar",
  closeLabel = "Cerrar",
  saving = false,
  saveDisabled = false,
  showSave = true,
  contentClassName,
}: CrudDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("border-(--security-border)", contentClassName)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid min-w-0 gap-4 py-2">{children}</div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {closeLabel}
          </Button>
          {mode !== "view" && onSave && showSave ? (
            <Button type="button" onClick={onSave} disabled={saving || saveDisabled}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                saveLabel
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
