import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CrudTable } from "@/app/components/security/crud-table";
import { PageShell } from "@/app/components/security/page-shell";
import { useUser } from "@/hooks/security";

type UserForm = {
  id: string;
  name: string;
  email: string;
  password: string;
};

const initialForm: UserForm = {
  id: "",
  name: "",
  email: "",
  password: "",
};

export default function UsersPage() {
  const { users, loading, error, loadUsers, addUser, editUser, removeUser } = useUser();
  const [form, setForm] = useState<UserForm>(initialForm);

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
      };

      if (!payload.name || !payload.email || (!form.id.trim() && !payload.password)) {
        throw new Error("Nombre, correo y contraseña son obligatorios para crear");
      }

      if (form.id.trim()) {
        const updatePayload: { name?: string; email?: string; password?: string } = {};

        if (payload.name) updatePayload.name = payload.name;
        if (payload.email) updatePayload.email = payload.email;
        if (payload.password) updatePayload.password = payload.password;

        await editUser(form.id, updatePayload);
        toast.success("Usuario actualizado");
      } else {
        await addUser(payload);
        toast.success("Usuario creado");
      }

      setForm(initialForm);
      await loadUsers();
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  return (
    <PageShell
      title="Usuarios"
      description="CRUD de usuarios basado en el hook useUser."
      aside={
        <div className="space-y-3">
          <p>El formulario sirve para crear o editar según llenes el ID.</p>
          <p>Si vas a editar, puedes dejar la contraseña vacía para no sobrescribirla.</p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="user-id">ID opcional para editar</Label>
            <Input
              id="user-id"
              value={form.id}
              onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="user-name">Nombre</Label>
            <Input
              id="user-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <Label htmlFor="user-email">Correo</Label>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="usuario@ucaldas.edu.co"
            />
          </div>
          <div>
            <Label htmlFor="user-password">Contraseña</Label>
            <Input
              id="user-password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Dejar vacío al editar"
            />
          </div>
          <Button type="submit" className="w-full">
            {form.id.trim() ? "Actualizar usuario" : "Crear usuario"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => setForm(initialForm)}>
            Limpiar
          </Button>
        </form>

        <CrudTable
          title="Listado de usuarios"
          description="Datos obtenidos directamente del hook."
          items={users}
          loading={loading}
          error={error}
          onRefresh={() => void loadUsers()}
          emptyMessage="No hay usuarios cargados."
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Nombre" },
            { key: "email", label: "Correo" },
          ]}
          renderActions={(user) => (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: user.password ?? "",
                  })
                }
              >
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await removeUser(user.id);
                  await loadUsers();
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