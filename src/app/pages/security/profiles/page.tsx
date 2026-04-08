import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CrudTable } from "@/app/components/security/crud-table";
import { PageShell } from "@/app/components/security/page-shell";
import { useProfile } from "@/hooks/security";

type ProfileForm = {
  id: string;
  phone: string;
  photo: string;
  user: string;
};

const initialForm: ProfileForm = {
  id: "",
  phone: "",
  photo: "",
  user: "{\n  \"id\": \"\",\n  \"name\": \"\",\n  \"email\": \"\",\n  \"password\": \"\"\n}",
};

export default function ProfilesPage() {
  const { profiles, loading, error, loadProfiles, addProfile, editProfile, removeProfile } = useProfile();
  const [form, setForm] = useState<ProfileForm>(initialForm);

  useEffect(() => {
    void loadProfiles();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const user = JSON.parse(form.user);
      const payload = {
        phone: form.phone.trim(),
        photo: form.photo.trim(),
        user,
      };

      if (!payload.phone || !payload.photo) {
        throw new Error("Teléfono y foto son obligatorios");
      }

      if (form.id.trim()) {
        await editProfile(form.id, payload);
        toast.success("Perfil actualizado");
      } else {
        await addProfile(payload);
        toast.success("Perfil creado");
      }

      setForm(initialForm);
      await loadProfiles();
    } catch (submitError) {
      toast.error(submitError instanceof SyntaxError ? "El campo user debe ser JSON válido" : (submitError as Error).message);
    }
  };

  return (
    <PageShell
      title="Perfiles"
      description="Módulo de perfiles con soporte para teléfono, foto y usuario asociado."
      aside={
        <div className="space-y-3">
          <p>El DTO de perfil usa un objeto de usuario anidado, por eso el formulario acepta JSON.</p>
          <p>Si ya tienes el usuario completo desde el backend, pégalo en el bloque correspondiente.</p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="profile-id">ID opcional para editar</Label>
            <Input
              id="profile-id"
              value={form.id}
              onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="profile-phone">Teléfono</Label>
            <Input
              id="profile-phone"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="profile-photo">Foto</Label>
            <Input
              id="profile-photo"
              value={form.photo}
              onChange={(event) => setForm((current) => ({ ...current, photo: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="profile-user">Usuario JSON</Label>
            <Textarea
              id="profile-user"
              rows={8}
              value={form.user}
              onChange={(event) => setForm((current) => ({ ...current, user: event.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full">
            {form.id.trim() ? "Actualizar perfil" : "Crear perfil"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => setForm(initialForm)}>
            Limpiar
          </Button>
        </form>

        <CrudTable
          title="Listado de perfiles"
          description="Perfiles cargados desde el hook."
          items={profiles}
          loading={loading}
          error={error}
          onRefresh={() => void loadProfiles()}
          emptyMessage="No hay perfiles cargados."
          columns={[
            { key: "id", label: "ID" },
            { key: "phone", label: "Teléfono" },
            { key: "photo", label: "Foto" },
            {
              key: "user",
              label: "Usuario",
              render: (_, profile) => profile.user?.name ?? profile.user?.email ?? "—",
            },
          ]}
          renderActions={(profile) => (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    id: profile.id,
                    phone: profile.phone,
                    photo: profile.photo,
                    user: JSON.stringify(profile.user, null, 2),
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
                  await removeProfile(profile.id);
                  await loadProfiles();
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