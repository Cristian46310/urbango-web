import { useEffect, useState } from "react";
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
import { useUser } from "@/hooks/security";
import type { User } from "@/core/domain/entities/security/User";

type UserDialogMode = "create" | "edit" | "view";

interface UserForm {
  id: string;
  name: string;
  email: string;
  password: string;
}

const initialForm: UserForm = {
  id: "",
  name: "",
  email: "",
  password: "",
};

export default function UsersPage() {
  const { users, loading, error, loadUsers, addUser, editUser, removeUser } = useUser();

  const [form, setForm] = useState<UserForm>(initialForm);
  const [dialogMode, setDialogMode] = useState<UserDialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, []);

  const openCreateDialog = () => {
    setForm(initialForm);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
    });
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const openViewDialog = (user: User) => {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
    });
    setDialogMode("view");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
      };

      if (!payload.name || !payload.email || (dialogMode === "create" && !payload.password)) {
        throw new Error("Nombre, correo y contraseña son obligatorios para crear.");
      }

      if (dialogMode === "edit") {
        const updatePayload: { name?: string; email?: string; password?: string } = {
          name: payload.name,
          email: payload.email,
        };

        if (payload.password) {
          updatePayload.password = payload.password;
        }

        await editUser(form.id, updatePayload);
        toast.success("Usuario actualizado correctamente");
      } else {
        await addUser(payload);
        toast.success("Usuario creado correctamente");
      }

      setIsDialogOpen(false);
      setForm(initialForm);
      await loadUsers();
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  const handleDelete = async (userId: string) => {
    await removeUser(userId);
    await loadUsers();
    toast.success("Usuario eliminado");
  };

  const columnHelper = createColumnHelper<User>();
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("name", {
      header: "Nombre",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("email", {
      header: "Correo",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const user = info.row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Opciones">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openViewDialog(user)}>
                  <Eye className="size-4" />
                  Ver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                  <Pencil className="size-4" />
                  Actualizar
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => { void handleDelete(user.id); }}>
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
      title="Gestion de usuarios"
      description="Administra las cuentas de acceso de forma rapida y clara."
      aside={
        <div className="space-y-3">
          <p>Desde aqui puedes registrar, consultar y actualizar usuarios.</p>
          <p>Para cambiar la contraseña en una edicion, escribe una nueva.</p>
        </div>
      }
    >
      <DataTable
        title="Listado de usuarios"
        description="Todos los usuarios disponibles en el sistema."
        data={users}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => {
          void loadUsers();
        }}
        filterField="name"
        filterPlaceholder="Buscar por nombre"
        emptyMessage="No hay usuarios registrados."
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
              {dialogMode === "create" ? "Adicionar usuario" : dialogMode === "edit" ? "Actualizar usuario" : "Detalle del usuario"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "view" ? "Informacion del usuario seleccionado." : "Completa los datos y guarda los cambios."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="user-name">Nombre</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                }}
                disabled={dialogMode === "view"}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-email">Correo</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => {
                  setForm((current) => ({ ...current, email: event.target.value }));
                }}
                disabled={dialogMode === "view"}
              />
            </div>

            {dialogMode !== "view" ? (
              <div className="grid gap-2">
                <Label htmlFor="user-password">
                  {dialogMode === "edit" ? "Nueva contraseña (opcional)" : "Contraseña"}
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, password: event.target.value }));
                  }}
                />
              </div>
            ) : null}
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
