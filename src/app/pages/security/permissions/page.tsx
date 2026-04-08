import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { CrudTable } from "@/app/components/security/crud-table";
import { PageShell } from "@/app/components/security/page-shell";
import { usePermission } from "@/hooks/security";

type PermissionForm = {
  id: string;
  url: string;
  method: string;
};

const initialForm: PermissionForm = {
  id: "",
  url: "",
  method: "GET",
};

export default function PermissionsPage() {
  const { permissions, loading, error, loadPermissions, addPermission, editPermission, removePermission } = usePermission();
  const [form, setForm] = useState<PermissionForm>(initialForm);

  useEffect(() => {
    void loadPermissions();
  }, []);

  const description = useMemo(() => "Gestiona los permisos HTTP por URL y método.", []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (!form.url.trim()) {
        throw new Error("La URL es obligatoria");
      }

      if (form.id.trim()) {
        await editPermission(form.id, {
          url: form.url.trim(),
          method: form.method as "GET" | "POST" | "PUT" | "DELETE",
        });
        toast.success("Permiso actualizado");
      } else {
        await addPermission({
          url: form.url.trim(),
          method: form.method as "GET" | "POST" | "PUT" | "DELETE",
        });
        toast.success("Permiso creado");
      }

      setForm(initialForm);
      await loadPermissions();
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  return (
    <PageShell
      title="Permisos"
      description={description}
      aside={
        <div className="space-y-3">
          <p>El hook expone lectura, creación, edición y eliminación de permisos.</p>
          <p>El campo método debe coincidir con el enum HTTP del dominio.</p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="permission-id">ID opcional para editar</Label>
            <Input
              id="permission-id"
              value={form.id}
              onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
              placeholder="Dejar vacío para crear"
            />
          </div>
          <div>
            <Label htmlFor="permission-url">URL</Label>
            <Input
              id="permission-url"
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              placeholder="/api/users"
            />
          </div>
          <div>
            <Label>Método</Label>
            <Select value={form.method} onValueChange={(value) => setForm((current) => ({ ...current, method: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                {(["GET", "POST", "PUT", "DELETE"] as const).map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            {form.id.trim() ? "Actualizar permiso" : "Crear permiso"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => setForm(initialForm)}>
            Limpiar
          </Button>
        </form>

        <CrudTable
          title="Listado"
          description="Permisos cargados desde el hook."
          items={permissions}
          loading={loading}
          error={error}
          onRefresh={() => void loadPermissions()}
          emptyMessage="Aún no hay permisos cargados."
          columns={[
            { key: "id", label: "ID" },
            { key: "url", label: "URL" },
            { key: "method", label: "Método" },
          ]}
          renderActions={(permission) => (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setForm({ id: permission.id, url: permission.url, method: permission.method })}
              >
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await removePermission(permission.id);
                  await loadPermissions();
                }}
              >
                Eliminar
              </Button>
            </div>
          )}
        />
      </div>
    </PageShell>
  );
}