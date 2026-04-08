import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/app/components/security/page-shell";
import { useUserRole } from "@/hooks/security";

export default function UserRolesPage() {
  const { loading, error, assignRoleToUser, assignMultipleRolesToUser, removeRoleFromUser } = useUserRole();
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roleIds, setRoleIds] = useState("");
  const [userRoleId, setUserRoleId] = useState("");

  return (
    <PageShell
      title="Usuario / Rol"
      description="Asignación y eliminación de relaciones entre usuarios y roles."
      aside={
        <div className="space-y-3">
          <p>Este hook no carga un listado, por eso la pantalla se centra en acciones concretas.</p>
          <p>Para múltiples roles usa IDs separados por coma.</p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await assignRoleToUser(userId.trim(), roleId.trim());
            toast.success("Rol asignado al usuario");
          }}
        >
          <div>
            <Label htmlFor="ur-user">ID de usuario</Label>
            <Input id="ur-user" value={userId} onChange={(event) => setUserId(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="ur-role">ID de rol</Label>
            <Input id="ur-role" value={roleId} onChange={(event) => setRoleId(event.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            Asignar rol
          </Button>
        </form>

        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await assignMultipleRolesToUser({
              userId: userId.trim(),
              roleIds: roleIds.split(",").map((value) => value.trim()).filter(Boolean),
            });
            toast.success("Roles asignados en bloque");
          }}
        >
          <div>
            <Label htmlFor="ur-multiple-user">ID de usuario</Label>
            <Input id="ur-multiple-user" value={userId} onChange={(event) => setUserId(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="ur-multiple-roles">IDs de roles separados por coma</Label>
            <Input
              id="ur-multiple-roles"
              value={roleIds}
              onChange={(event) => setRoleIds(event.target.value)}
              placeholder="role-1, role-2, role-3"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            Asignar múltiples
          </Button>
        </form>

        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await removeRoleFromUser(userRoleId.trim());
            toast.success("Relación eliminada");
          }}
        >
          <div>
            <Label htmlFor="ur-link-id">ID de relación usuario-rol</Label>
            <Input id="ur-link-id" value={userRoleId} onChange={(event) => setUserRoleId(event.target.value)} />
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