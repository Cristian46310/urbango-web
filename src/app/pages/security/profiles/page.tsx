import { useEffect, useMemo, useState } from "react";
import { Eye, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createColumnHelper } from "@tanstack/react-table";

import { DataTable } from "@/app/components/security/data-table";
import { PageShell } from "@/app/components/security/page-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile, useUser } from "@/hooks/security";
import type { User } from "@/core/domain/entities/security/User";
import type { Profile } from "@/core/domain/entities/security/Profile";

type ProfileDialogMode = "create" | "edit" | "view";

interface ProfileForm {
  id: string;
  phone: string;
  photo: string;
  userId: string;
}

type ProfileWithOptionalUser = Profile & {
  user?: User | null;
  userId?: string;
};

const initialForm: ProfileForm = {
  id: "",
  phone: "",
  photo: "",
  userId: "",
};

export default function ProfilesPage() {
  const { profiles, loading, error, loadProfiles, addProfile, editProfile, removeProfile } = useProfile();
  const { users, loadUsers } = useUser();

  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [dialogMode, setDialogMode] = useState<ProfileDialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void loadProfiles();
    void loadUsers();
  }, []);

  const usersById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  const mapProfileToForm = (profile: Profile): ProfileForm => {
    const profileWithOptionalUser = profile as ProfileWithOptionalUser;

    return {
      id: profile.id,
      phone: profile.phone,
      photo: profile.photo,
      userId: profileWithOptionalUser.user?.id ?? profileWithOptionalUser.userId ?? "",
    };
  };

  const openCreateDialog = () => {
    setForm(initialForm);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (profile: Profile) => {
    setForm(mapProfileToForm(profile));
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const openViewDialog = (profile: Profile) => {
    setForm(mapProfileToForm(profile));
    setDialogMode("view");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const user = usersById.get(form.userId);

      if (!form.phone.trim() || !form.photo.trim()) {
        throw new Error("Telefono y foto son obligatorios.");
      }

      if (!user) {
        throw new Error("Debes seleccionar un usuario valido.");
      }

      if (dialogMode === "edit") {
        await editProfile(form.id, {
          phone: form.phone.trim(),
          photo: form.photo.trim(),
          user,
        });
        toast.success("Perfil actualizado correctamente");
      } else {
        await addProfile({
          phone: form.phone.trim(),
          photo: form.photo.trim(),
          user,
        });
        toast.success("Perfil creado correctamente");
      }

      setIsDialogOpen(false);
      setForm(initialForm);
      await loadProfiles();
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  const handleDelete = async (profileId: string) => {
    await removeProfile(profileId);
    await loadProfiles();
    toast.success("Perfil eliminado");
  };

  const columnHelper = createColumnHelper<Profile>();
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("phone", {
      header: "Telefono",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("photo", {
      header: "Foto",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "usuario",
      header: "Usuario",
      cell: (info) => {
        const profile = info.row.original as ProfileWithOptionalUser;
        const user = profile.user;

        if (user) {
          return user.name || user.email;
        }

        return profile.userId ?? "Sin usuario";
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const profile = info.row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Opciones">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { openViewDialog(profile); }}>
                  <Eye className="size-4" />
                  Ver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { openEditDialog(profile); }}>
                  <Pencil className="size-4" />
                  Actualizar
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => { void handleDelete(profile.id); }}>
                  <Trash2 className="size-4" />
                  Borrar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ];

  return (
    <PageShell
      title="Gestion de perfiles"
      description="Relaciona informacion de contacto con cada usuario sin editar JSON manualmente."
      aside={
        <div className="space-y-3">
          <p>Selecciona el usuario desde la lista para crear o actualizar su perfil.</p>
          <p>Asi evitas errores de estructura y trabajas mas rapido.</p>
        </div>
      }
    >
      <DataTable
        title="Listado de perfiles"
        description="Perfiles asociados a usuarios del sistema."
        data={profiles}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => {
          void loadProfiles();
        }}
        filterField="phone"
        filterPlaceholder="Buscar por telefono"
        emptyMessage="No hay perfiles registrados."
        toolbarAction={
          <Button type="button" size="sm" onClick={openCreateDialog}>
            <Plus className="mr-1 size-4" />
            Adicionar
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-(--security-border)">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Adicionar perfil" : dialogMode === "edit" ? "Actualizar perfil" : "Detalle del perfil"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "view" ? "Informacion del perfil seleccionado." : "Completa los datos del perfil y selecciona su usuario."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-phone">Telefono</Label>
              <Input
                id="profile-phone"
                value={form.phone}
                onChange={(event) => {
                  setForm((current) => ({ ...current, phone: event.target.value }));
                }}
                disabled={dialogMode === "view"}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-photo">Foto</Label>
              <Input
                id="profile-photo"
                value={form.photo}
                onChange={(event) => {
                  setForm((current) => ({ ...current, photo: event.target.value }));
                }}
                disabled={dialogMode === "view"}
              />
            </div>

            <div className="grid gap-2">
              <Label>Usuario asociado</Label>
              <Select
                value={form.userId}
                onValueChange={(value) => {
                  setForm((current) => ({ ...current, userId: value }));
                }}
                disabled={dialogMode === "view"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
              }}
            >
              Cerrar
            </Button>
            {dialogMode !== "view" ? (
              <Button type="button" onClick={() => { void handleSave(); }}>
                Guardar
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
