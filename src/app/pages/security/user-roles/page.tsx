import { useEffect, useMemo, useState } from "react";
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
import { useRole, useUser, useUserRole } from "@/hooks/security";

export default function UserRolesPage() {
  const { loading, error, assignRoleToUser, assignMultipleRolesToUser, removeRoleFromUser } = useUserRole();
  const { users, loadUsers } = useUser();
  const { roles, loadRoles } = useRole();

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [userRoleIdToRemove, setUserRoleIdToRemove] = useState("");

  useEffect(() => {
    void loadUsers();
    void loadRoles();
  }, []);

  const selectedUserName = useMemo(() => {
    return users.find((user) => user.id === selectedUserId)?.name ?? "";
  }, [users, selectedUserId]);

  const assignSingle = async () => {
    if (!selectedUserId || !selectedRoleId) {
      toast.error("Selecciona un usuario y un rol.");
      return;
    }

    await assignRoleToUser(selectedUserId, selectedRoleId);
    toast.success("Rol asignado al usuario");
  };

  const assignMultiple = async () => {
    if (!selectedUserId || selectedRoleIds.length === 0) {
      toast.error("Selecciona un usuario y al menos un rol.");
      return;
    }

    await assignMultipleRolesToUser({
      userId: selectedUserId,
      roleIds: selectedRoleIds,
    });
    toast.success("Roles asignados correctamente");
  };

  const removeByRelationId = async () => {
    if (!userRoleIdToRemove) {
      toast.error("Selecciona el ID de relacion a eliminar.");
      return;
    }

    await removeRoleFromUser(userRoleIdToRemove);
    toast.success("Relacion usuario/rol eliminada");
  };

  return (
    <PageShell
      title="Gestion de relacion usuario / rol"
      description="Asigna roles a usuarios con listas seleccionables."
      aside={
        <div className="space-y-3">
          <p>Ahora no necesitas escribir IDs de usuario o rol manualmente.</p>
          <p>Para eliminar una relacion aun se requiere el ID de la relacion creado por backend.</p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-(--security-border) bg-(--security-surface) p-5 shadow-sm">
          <h3 className="text-base font-semibold text-(--security-foreground)">Asignar un rol</h3>

          <div className="grid gap-2">
            <Label>Usuario</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <Button type="button" disabled={loading} className="w-full" onClick={() => { void assignSingle(); }}>
            Asignar rol
          </Button>
        </div>

        <div className="space-y-4 rounded-2xl border border-(--security-border) bg-(--security-surface) p-5 shadow-sm">
          <h3 className="text-base font-semibold text-(--security-foreground)">Asignar varios roles</h3>
          <p className="text-sm text-(--security-muted-foreground)">
            Usuario seleccionado: {selectedUserName || "Ninguno"}
          </p>

          <div className="grid gap-2">
            <Label>Selecciona roles (uno por vez)</Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (!selectedRoleIds.includes(value)) {
                  setSelectedRoleIds((current) => [...current, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Agregar rol" />
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

          <div className="rounded-lg border border-(--security-border) bg-card p-3 text-sm text-(--security-muted-foreground)">
            {selectedRoleIds.length === 0 ? "Sin roles seleccionados" : selectedRoleIds.join(", ")}
          </div>

          <Button type="button" disabled={loading} className="w-full" onClick={() => { void assignMultiple(); }}>
            Asignar roles seleccionados
          </Button>
        </div>

        <div className="space-y-4 rounded-2xl border border-(--security-border) bg-(--security-surface) p-5 shadow-sm">
          <h3 className="text-base font-semibold text-(--security-foreground)">Eliminar relacion</h3>
          <p className="text-sm text-(--security-muted-foreground)">
            Esta accion requiere el ID de relacion usuario/rol que entrega el backend.
          </p>

          <div className="grid gap-2">
            <Label htmlFor="user-role-id">ID de relacion</Label>
            <Input
              id="user-role-id"
              value={userRoleIdToRemove}
              onChange={(event) => {
                setUserRoleIdToRemove(event.target.value);
              }}
              placeholder="Ej: 93c4e2..."
            />
          </div>

          <Button type="button" variant="destructive" disabled={loading} className="w-full" onClick={() => { void removeByRelationId(); }}>
            Eliminar relacion
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </PageShell>
  );
}
