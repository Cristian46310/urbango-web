import { useEffect, useState } from "react";
import { Eye, MoreVertical, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { createColumnHelper } from "@tanstack/react-table";

import { DataTable } from "@/app/components/security/data-table";
import { PageShell } from "@/app/components/security/page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useRole, useUserRole } from "@/hooks/security";
import type { Role } from "@/core/domain/entities/security/Role";
import type { User } from "@/core/domain/entities/security/User";

type UserDialogMode = "create" | "edit" | "view";

interface UserForm {
  id: string;
  name: string;
  email: string;
  password: string;
}

interface UserRoleDetail {
  name: string;
  description: string;
}

interface UserDetail extends User {
  roles: UserRoleDetail[];
}

type UserSelection = UserDetail;

const initialForm: UserForm = {
  id: "",
  name: "",
  email: "",
  password: "",
};

const PAGE_SIZE = 10;
const LOOKUP_PAGE_SIZE = 10;
const ASSIGN_ROLES_PAGE_SIZE = 8;

const normalizeRoleName = (name: string) => name.trim().toLowerCase();

const dedupeRolesById = (roles: Role[]) => {
  const seen = new Set<string>();
  return roles.filter((role) => {
    if (seen.has(role.id)) {
      return false;
    }
    seen.add(role.id);
    return true;
  });
};

export default function UsersPage() {
  const { users, usersPage, loading, error, loadUsers, getUserById, addUser, editUser, removeUser } = useUser();
  const { loadRoles } = useRole();
  const { assignMultipleRolesToUser } = useUserRole();

  const [form, setForm] = useState<UserForm>(initialForm);
  const [dialogMode, setDialogMode] = useState<UserDialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignRolesDialogOpen, setIsAssignRolesDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSelection | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [assignRolesPage, setAssignRolesPage] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const assignRolesPageCount = Math.max(1, Math.ceil(availableRoles.length / ASSIGN_ROLES_PAGE_SIZE));
  const visibleRoles = availableRoles.slice(
    assignRolesPage * ASSIGN_ROLES_PAGE_SIZE,
    (assignRolesPage + 1) * ASSIGN_ROLES_PAGE_SIZE,
  );

  useEffect(() => {
    void loadUsers({ page: currentPage, size: PAGE_SIZE });
  }, [currentPage]);

  useEffect(() => {
    void (async () => {
      await ensureRolesLoaded();
    })();
  }, []);

  const ensureRolesLoaded = async () => {
    if (availableRoles.length > 0) {
      return availableRoles;
    }

    const collected: Role[] = [];
    let page = 0;
    let totalPages = 1;

    do {
      const response = await loadRoles({ page, size: LOOKUP_PAGE_SIZE });
      collected.push(...response.content);
      totalPages = response.totalPages;
      page += 1;
    } while (page < totalPages);

    const allRoles = dedupeRolesById(collected);
    setAvailableRoles(allRoles);
    return allRoles;
  };

  const openCreateDialog = () => {
    setForm(initialForm);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = async (user: User) => {
    const detailedUser = await getUserById(user.id);
    setForm({
      id: detailedUser.id,
      name: detailedUser.name,
      email: detailedUser.email,
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

  const openAssignRolesDialog = async (user: User) => {
    const [detailedUser, allRoles] = await Promise.all([
      getUserById(user.id) as Promise<UserDetail>,
      ensureRolesLoaded(),
    ]);

    const assignedRoles = detailedUser.roles ?? [];
    const assignedRoleNames = assignedRoles.map((role) => normalizeRoleName(role.name));
    const assignedRoleNamesSet = new Set(assignedRoleNames);
    const assignedRoleIds = allRoles
      .filter((role) => assignedRoleNamesSet.has(normalizeRoleName(role.name)))
      .map((role) => role.id);

    setSelectedUser({
      ...detailedUser,
      roles: assignedRoles,
    });
    setSelectedRoleIds(assignedRoleIds);
    setAssignRolesPage(0);
    setIsAssignRolesDialogOpen(true);
  };

  const closeAssignRolesDialog = () => {
    setIsAssignRolesDialogOpen(false);
    setSelectedUser(null);
    setSelectedRoleIds([]);
    setAssignRolesPage(0);
  };

  const toggleRoleSelection = (roleId: string, checked: boolean) => {
    setSelectedRoleIds((current) => {
      if (checked) {
        return current.includes(roleId) ? current : [...current, roleId];
      }

      return current.filter((currentRoleId) => currentRoleId !== roleId);
    });
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
      await loadUsers({ page: currentPage, size: PAGE_SIZE });
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  const handleDelete = async (userId: string) => {
    await removeUser(userId);
    await loadUsers({ page: currentPage, size: PAGE_SIZE });
    toast.success("Usuario eliminado");
  };

  const handleAssignRoles = async () => {
    if (!selectedUser) {
      toast.error("Selecciona un usuario.");
      return;
    }

    if (selectedRoleIds.length > 0) {
      await assignMultipleRolesToUser({
        userId: selectedUser.id,
        roleIds: selectedRoleIds,
      });
    }

    closeAssignRolesDialog();
    toast.success("Roles actualizados correctamente");
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
                <DropdownMenuItem onClick={() => { openViewDialog(user); }}>
                  <Eye className="size-4" />
                  Ver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { void openAssignRolesDialog(user); }}>
                  <UserCog className="size-4" />
                  Asignar roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { void openEditDialog(user); }}>
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
          void loadUsers({ page: currentPage, size: PAGE_SIZE });
        }}
        pageIndex={currentPage}
        pageSize={PAGE_SIZE}
        pageCount={usersPage?.totalPages ?? 1}
        totalItems={usersPage?.totalElements}
        onPageChange={setCurrentPage}
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

      <Dialog open={isAssignRolesDialogOpen} onOpenChange={setIsAssignRolesDialogOpen}>
        <DialogContent className="max-w-4xl border-(--security-border)">
          <DialogHeader>
            <DialogTitle>Asignar roles</DialogTitle>
            <DialogDescription>
              Marca o desmarca los roles que deben quedar asociados al usuario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="text-sm text-(--security-muted-foreground)">
              {selectedUser ? (
                <span>
                  Usuario seleccionado: <span className="font-medium text-(--security-foreground)">{selectedUser.name}</span>
                </span>
              ) : null}
            </div>

            <div className="rounded-xl border border-(--security-border)">
              <table className="min-w-full text-sm">
                <thead className="bg-(--security-surface)">
                  <tr className="border-b border-(--security-border)">
                    <th className="w-14 px-4 py-3 text-left font-semibold">Sel.</th>
                    <th className="px-4 py-3 text-left font-semibold">Rol</th>
                    <th className="px-4 py-3 text-left font-semibold">Descripcion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--security-border)">
                  {visibleRoles.map((role) => {
                    const checked = selectedRoleIds.includes(role.id);

                    return (
                      <tr key={role.id} className="hover:bg-(--security-surface)">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              toggleRoleSelection(role.id, Boolean(value));
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-(--security-foreground)">{role.name}</td>
                        <td className="px-4 py-3 text-(--security-muted-foreground)">{role.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-(--security-muted-foreground)">
              <span>
                Pagina {assignRolesPage + 1} de {assignRolesPageCount}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAssignRolesPage((current) => Math.max(0, current - 1));
                  }}
                  disabled={assignRolesPage === 0}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAssignRolesPage((current) => Math.min(assignRolesPageCount - 1, current + 1));
                  }}
                  disabled={assignRolesPage >= assignRolesPageCount - 1}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAssignRolesDialog}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => { void handleAssignRoles(); }}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
