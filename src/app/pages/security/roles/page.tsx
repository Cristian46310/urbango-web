import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CrudTable } from "@/app/components/security/crud-table";
import { PageShell } from "@/app/components/security/page-shell";
import { useRole } from "@/hooks/security";

export default function RolesPage() {
  const { roles, loading, error, loadRoles, getRoleById } = useRole();
  const [roleId, setRoleId] = useState("");
  const [selectedRole, setSelectedRole] = useState<{ id: string; name: string; description: string } | null>(null);

  useEffect(() => {
    void loadRoles();
  }, []);

  return (
    <PageShell
      title="Roles"
      description="Vista de consulta para roles. El hook actual solo expone lectura."
      aside={
        <div className="space-y-3">
          <p>Este módulo es intencionalmente de solo lectura porque el hook no expone creación o borrado.</p>
          <p>Puedes usar la búsqueda por ID para inspeccionar un rol puntual.</p>
        </div>
      }
    >
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Label htmlFor="role-id">Buscar rol por ID</Label>
            <Input id="role-id" value={roleId} onChange={(event) => setRoleId(event.target.value)} />
          </div>
          <Button
            type="button"
            onClick={async () => {
              if (!roleId.trim()) return;
              setSelectedRole(await getRoleById(roleId.trim()));
            }}
          >
            Consultar
          </Button>
        </div>

        {selectedRole ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Resultado</p>
            <p>ID: {selectedRole.id}</p>
            <p>Nombre: {selectedRole.name}</p>
            <p>Descripción: {selectedRole.description}</p>
          </div>
        ) : null}
      </div>

      <CrudTable
        title="Listado de roles"
        description="Datos cargados desde el hook useRole."
        items={roles}
        loading={loading}
        error={error}
        onRefresh={() => void loadRoles()}
        emptyMessage="No hay roles disponibles."
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Nombre" },
          { key: "description", label: "Descripción" },
        ]}
      />
    </PageShell>
  );
}