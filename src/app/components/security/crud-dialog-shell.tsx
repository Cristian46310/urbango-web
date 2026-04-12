import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}: CrudDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-(--security-border)">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">{children}</div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {closeLabel}
          </Button>
          {mode !== "view" && onSave ? (
            <Button type="button" onClick={onSave}>
              {saveLabel}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
