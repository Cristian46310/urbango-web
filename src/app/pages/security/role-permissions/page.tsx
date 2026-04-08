import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/app/components/security/page-shell";
import { useRolePermission } from "@/hooks/security";

export default function RolePermissionsPage() {
  const { loading, error, assignPermissionToRole, removePermissionRoleLink } = useRolePermission();
  const [roleId, setRoleId] = useState("");
  const [permissionId, setPermissionId] = useState("");
  const [rolePermissionId, setRolePermissionId] = useState("");

  return (
    <PageShell
      title="Rol / Permiso"
      description="Administración de relaciones entre roles y permisos."
      aside={
        <div className="space-y-3">
          <p>Este módulo también es de acción directa, sin listado asociado al hook.</p>
          <p>Puedes asignar o eliminar relaciones con IDs individuales.</p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await assignPermissionToRole(roleId.trim(), permissionId.trim());
            toast.success("Permiso asignado al rol");
          }}
        >
          <div>
            <Label htmlFor="rp-role">ID de rol</Label>
            <Input id="rp-role" value={roleId} onChange={(event) => setRoleId(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="rp-permission">ID de permiso</Label>
            <Input id="rp-permission" value={permissionId} onChange={(event) => setPermissionId(event.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            Asignar permiso
          </Button>
        </form>

        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await removePermissionRoleLink(rolePermissionId.trim());
            toast.success("Relación rol-permiso eliminada");
          }}
        >
          <div>
            <Label htmlFor="rp-link">ID de relación rol-permiso</Label>
            <Input id="rp-link" value={rolePermissionId} onChange={(event) => setRolePermissionId(event.target.value)} />
          </div>
          <Button type="submit" disabled={loading} variant="destructive" className="w-full">
            Eliminar relación
          </Button>
        </form>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </PageShell>
  );
}