import { useState } from "react";
import type { Role } from "@/core/domain/entities/security/Role";
import { CrudDialogShell } from "@/app/components/security/crud-dialog-shell";
import { DialogField } from "@/app/components/security/dialog-field";
import { Input } from "@/components/ui/input";

interface RoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: { name: string; description: string }) => Promise<Role>;
  onAfterCreate?: (role: Role) => Promise<void>;
}

export function RoleCreateDialog({ open, onOpenChange, onSave, onAfterCreate }: RoleCreateDialogProps) {
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  const handleSave = async () => {
    const created = await onSave(createForm);
    setCreateForm({ name: "", description: "" });
    onOpenChange(false);
    
    if (onAfterCreate) {
      await onAfterCreate(created);
    }
  };

  const handleClose = () => {
    setCreateForm({ name: "", description: "" });
    onOpenChange(false);
  };

  return (
    <CrudDialogShell
      open={open}
      onOpenChange={onOpenChange}
      mode="create"
      title="Adicionar rol"
      description="Crea un nuevo rol y luego asigna permisos si lo deseas."
      onClose={handleClose}
      onSave={() => { void handleSave(); }}
    >
      <DialogField label="Nombre" htmlFor="role-name">
        <Input
          id="role-name"
          value={createForm.name}
          onChange={(e) => { setCreateForm((c) => ({ ...c, name: e.target.value })); }}
        />
      </DialogField>

      <DialogField label="Descripcion" htmlFor="role-description">
        <Input
          id="role-description"
          value={createForm.description}
          onChange={(e) => { setCreateForm((c) => ({ ...c, description: e.target.value })); }}
        />
      </DialogField>
    </CrudDialogShell>
  );
}
