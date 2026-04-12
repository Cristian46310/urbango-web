import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";

import { CrudDialogShell } from "@/app/components/security/crud-dialog-shell";
import { DataTable } from "@/app/components/security/data-table";
import { DialogField } from "@/app/components/security/dialog-field";
import { PageShell } from "@/app/components/security/page-shell";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import {
  SECURITY_ASSIGNMENT_PAGE_SIZE,
  SECURITY_LOOKUP_PAGE_SIZE,
  SECURITY_PAGE_SIZE,
} from "@/app/components/security/constants";
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
import { Input } from "@/components/ui/input";
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

  const assignRolesPageCount = Math.max(1, Math.ceil(availableRoles.length / SECURITY_ASSIGNMENT_PAGE_SIZE));
  const visibleRoles = availableRoles.slice(
    assignRolesPage * SECURITY_ASSIGNMENT_PAGE_SIZE,
    (assignRolesPage + 1) * SECURITY_ASSIGNMENT_PAGE_SIZE,
  );

  const ensureRolesLoaded = useCallback(async () => {
    if (availableRoles.length > 0) {
      return availableRoles;
    }

    const collected: Role[] = [];
    let page = 0;
    let totalPages = 1;

    do {
      const response = await loadRoles({ page, size: SECURITY_LOOKUP_PAGE_SIZE });
      collected.push(...response.content);
      totalPages = response.totalPages;
      page += 1;
    } while (page < totalPages);

    const allRoles = dedupeRolesById(collected);
    setAvailableRoles(allRoles);
    return allRoles;
  }, [availableRoles, loadRoles]);

  useEffect(() => {
    void loadUsers({ page: currentPage, size: SECURITY_PAGE_SIZE });
  }, [currentPage, loadUsers]);

  useEffect(() => {
    void (async () => {
      await ensureRolesLoaded();
    })();
  }, [ensureRolesLoaded]);

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

    const assignedRoles = detailedUser.roles;
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
      } else {
        await addUser(payload);
      }

      setIsDialogOpen(false);
      setForm(initialForm);
      await loadUsers({ page: currentPage, size: SECURITY_PAGE_SIZE });
    } catch {
      // Store layer handles user feedback.
    }
  };

  const handleDelete = async (userId: string) => {
    await removeUser(userId);
    await loadUsers({ page: currentPage, size: SECURITY_PAGE_SIZE });
  };

  const handleAssignRoles = async () => {
    if (!selectedUser) {
      return;
    }

    if (selectedRoleIds.length > 0) {
      await assignMultipleRolesToUser({
        userId: selectedUser.id,
        roleIds: selectedRoleIds,
      });
    }

    closeAssignRolesDialog();
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
          <RowActionsDropdown
            actions={[
              {
                label: "Ver",
                icon: Eye,
                onClick: () => {
                  openViewDialog(user);
                },
              },
              {
                label: "Asignar roles",
                icon: UserCog,
                onClick: () => {
                  void openAssignRolesDialog(user);
                },
              },
              {
                label: "Actualizar",
                icon: Pencil,
                onClick: () => {
                  void openEditDialog(user);
                },
              },
              {
                label: "Borrar",
                icon: Trash2,
                variant: "destructive",
                onClick: () => {
                  void handleDelete(user.id);
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
      title="Gestion de usuarios"
      description="Administra las cuentas de acceso de forma rapida y clara."
    >
      <DataTable
        title="Listado de usuarios"
        description="Todos los usuarios disponibles en el sistema."
        data={users}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => {
          void loadUsers({ page: currentPage, size: SECURITY_PAGE_SIZE });
        }}
        pageIndex={currentPage}
        pageSize={SECURITY_PAGE_SIZE}
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

      <CrudDialogShell
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        title={dialogMode === "create" ? "Adicionar usuario" : dialogMode === "edit" ? "Actualizar usuario" : "Detalle del usuario"}
        description={dialogMode === "view" ? "Informacion del usuario seleccionado." : "Completa los datos y guarda los cambios."}
        onClose={() => {
          setIsDialogOpen(false);
        }}
        onSave={() => {
          void handleSave();
        }}
      >
        <DialogField label="Nombre" htmlFor="user-name">
          <Input
            id="user-name"
            value={form.name}
            onChange={(event) => {
              setForm((current) => ({ ...current, name: event.target.value }));
            }}
            disabled={dialogMode === "view"}
          />
        </DialogField>

        <DialogField label="Correo" htmlFor="user-email">
          <Input
            id="user-email"
            type="email"
            value={form.email}
            onChange={(event) => {
              setForm((current) => ({ ...current, email: event.target.value }));
            }}
            disabled={dialogMode === "view"}
          />
        </DialogField>

        {dialogMode !== "view" ? (
          <DialogField
            label={dialogMode === "edit" ? "Nueva contraseña (opcional)" : "Contraseña"}
            htmlFor="user-password"
          >
            <Input
              id="user-password"
              type="password"
              value={form.password}
              onChange={(event) => {
                setForm((current) => ({ ...current, password: event.target.value }));
              }}
            />
          </DialogField>
        ) : null}
      </CrudDialogShell>

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
