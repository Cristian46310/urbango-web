import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";

import { CrudDialogShell } from "@/app/components/security/crud-dialog-shell";
import { DataTable } from "@/app/components/security/data-table";
import { DialogField } from "@/app/components/security/dialog-field";
import { PageShell } from "@/app/components/security/page-shell";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { SECURITY_LOOKUP_LARGE_PAGE_SIZE, SECURITY_PAGE_SIZE } from "@/app/components/security/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  userId?: string;
};

const initialForm: ProfileForm = {
  id: "",
  phone: "",
  photo: "",
  userId: "",
};

export default function ProfilesPage() {
  const { profiles, profilesPage, loading, error, loadProfiles, addProfile, editProfile, removeProfile } = useProfile();
  const { users, loadUsers } = useUser();

  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [dialogMode, setDialogMode] = useState<ProfileDialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    void loadProfiles({ page: currentPage, size: SECURITY_PAGE_SIZE });
    void loadUsers({ page: 0, size: SECURITY_LOOKUP_LARGE_PAGE_SIZE });
  }, [currentPage]);

  const usersById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  const mapProfileToForm = (profile: Profile): ProfileForm => {
    const profileWithOptionalUser = profile as ProfileWithOptionalUser;

    return {
      id: profile.id,
      phone: profile.phone,
      photo: profile.photo,
      userId: profileWithOptionalUser.userId ?? profile.user.id,
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
      } else {
        await addProfile({
          phone: form.phone.trim(),
          photo: form.photo.trim(),
          user,
        });
      }

      setIsDialogOpen(false);
      setForm(initialForm);
      await loadProfiles({ page: currentPage, size: SECURITY_PAGE_SIZE });
    } catch {
      // Store layer handles user feedback.
    }
  };

  const handleDelete = async (profileId: string) => {
    await removeProfile(profileId);
    await loadProfiles({ page: currentPage, size: SECURITY_PAGE_SIZE });
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
        return user.name || user.email;
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const profile = info.row.original;
        return (
          <RowActionsDropdown
            actions={[
              {
                label: "Ver",
                icon: Eye,
                onClick: () => {
                  openViewDialog(profile);
                },
              },
              {
                label: "Actualizar",
                icon: Pencil,
                onClick: () => {
                  openEditDialog(profile);
                },
              },
              {
                label: "Borrar",
                icon: Trash2,
                variant: "destructive",
                onClick: () => {
                  void handleDelete(profile.id);
                },
              },
            ]}
          />
        );
      },
    }),
  ];

  return (
    <PageShell
      title="Gestion de perfiles"
      description="Relaciona informacion de contacto con cada usuario sin editar JSON manualmente."
    >
      <DataTable
        title="Listado de perfiles"
        description="Perfiles asociados a usuarios del sistema."
        data={profiles}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => {
          void loadProfiles({ page: currentPage, size: SECURITY_PAGE_SIZE });
        }}
        pageIndex={currentPage}
        pageSize={SECURITY_PAGE_SIZE}
        pageCount={profilesPage?.totalPages ?? 1}
        totalItems={profilesPage?.totalElements}
        onPageChange={setCurrentPage}
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

      <CrudDialogShell
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        title={dialogMode === "create" ? "Adicionar perfil" : dialogMode === "edit" ? "Actualizar perfil" : "Detalle del perfil"}
        description={dialogMode === "view" ? "Informacion del perfil seleccionado." : "Completa los datos del perfil y selecciona su usuario."}
        onClose={() => {
          setIsDialogOpen(false);
        }}
        onSave={() => {
          void handleSave();
        }}
      >
        <DialogField label="Telefono" htmlFor="profile-phone">
          <Input
            id="profile-phone"
            value={form.phone}
            onChange={(event) => {
              setForm((current) => ({ ...current, phone: event.target.value }));
            }}
            disabled={dialogMode === "view"}
          />
        </DialogField>

        <DialogField label="Foto" htmlFor="profile-photo">
          <Input
            id="profile-photo"
            value={form.photo}
            onChange={(event) => {
              setForm((current) => ({ ...current, photo: event.target.value }));
            }}
            disabled={dialogMode === "view"}
          />
        </DialogField>

        <DialogField label="Usuario asociado">
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
        </DialogField>
      </CrudDialogShell>
    </PageShell>
  );
}
