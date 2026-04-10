import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/app/components/security/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermission, useRole, useRolePermission } from "@/hooks/security";

export default function RolePermissionsPage() {
  const { loading, error, assignPermissionToRole, removePermissionRoleLink } = useRolePermission();
  const { roles, loadRoles } = useRole();
  const { permissions, loadPermissions } = usePermission();

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionId, setSelectedPermissionId] = useState("");
  const [rolePermissionId, setRolePermissionId] = useState("");

  useEffect(() => {
    void loadRoles();
    void loadPermissions();
  }, []);

  const handleAssign = async () => {
    if (!selectedRoleId || !selectedPermissionId) {
      toast.error("Selecciona un rol y un permiso.");
      return;
    }

    await assignPermissionToRole(selectedRoleId, selectedPermissionId);
    toast.success("Permiso asignado al rol");
  };

  const handleRemove = async () => {
    if (!rolePermissionId.trim()) {
      toast.error("Ingresa el ID de relacion a eliminar.");
      return;
    }

    await removePermissionRoleLink(rolePermissionId.trim());
    toast.success("Relacion rol/permiso eliminada");
  };

  return (
    <PageShell
      title="Gestion de relacion rol / permiso"
      description="Asigna permisos a roles usando listas disponibles en el sistema."
      aside={
        <div className="space-y-3">
          <p>Ya no necesitas escribir IDs de rol o permiso manualmente.</p>
          <p>La eliminacion de relacion sigue usando el ID devuelto por el backend.</p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-(--security-border) bg-(--security-surface) p-5 shadow-sm">
          <h3 className="text-base font-semibold text-(--security-foreground)">Asignar permiso a rol</h3>

          <div className="grid gap-2">
            <Label>Rol</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Permiso</Label>
            <Select value={selectedPermissionId} onValueChange={setSelectedPermissionId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un permiso" />
              </SelectTrigger>
              <SelectContent>
                {permissions.map((permission) => (
                  <SelectItem key={permission.id} value={permission.id}>
                    {permission.method} - {permission.url}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" disabled={loading} className="w-full" onClick={() => { void handleAssign(); }}>
            Asignar permiso
          </Button>
        </div>

        <div className="space-y-4 rounded-2xl border border-(--security-border) bg-(--security-surface) p-5 shadow-sm">
          <h3 className="text-base font-semibold text-(--security-foreground)">Eliminar relacion</h3>
          <p className="text-sm text-(--security-muted-foreground)">
            Para esta accion, usa el ID de relacion rol/permiso generado por backend.
          </p>

          <div className="grid gap-2">
            <Label htmlFor="role-permission-id">ID de relacion</Label>
            <Input
              id="role-permission-id"
              value={rolePermissionId}
              onChange={(event) => {
                setRolePermissionId(event.target.value);
              }}
              placeholder="Ej: 4d1a0f..."
            />
          </div>

          <Button type="button" variant="destructive" disabled={loading} className="w-full" onClick={() => { void handleRemove(); }}>
            Eliminar relacion
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </PageShell>
  );
}
