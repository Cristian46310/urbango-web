import { useCallback, useEffect, useState } from "react";
import { Eye, ShieldCheck } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";

import {
  SECURITY_ASSIGNMENT_PAGE_SIZE,
  SECURITY_LOOKUP_PAGE_SIZE,
  SECURITY_PAGE_SIZE,
} from "@/app/components/security/constants";
import { DataTable } from "@/app/components/security/data-table";
import { PageShell } from "@/app/components/security/page-shell";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
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
import { usePermission, useRole, useRolePermission } from "@/hooks/security";
import type { Permission } from "@/core/domain/entities/security/Permission";
import type { Role } from "@/core/domain/entities/security/Role";

interface RoleDetail extends Role {
  permissions: Permission[];
}

export default function RolesPage() {
  const { roles, rolesPage, loading, error, loadRoles, getRoleById } = useRole();
  const { loadPermissions } = usePermission();
  const { assignMultiplePermissionsToRole } = useRolePermission();

  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignPermissionsOpen, setIsAssignPermissionsOpen] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [assignPermissionsPage, setAssignPermissionsPage] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const assignPermissionsPageCount = Math.max(1, Math.ceil(availablePermissions.length / SECURITY_ASSIGNMENT_PAGE_SIZE));
  const visiblePermissions = availablePermissions.slice(
    assignPermissionsPage * SECURITY_ASSIGNMENT_PAGE_SIZE,
    (assignPermissionsPage + 1) * SECURITY_ASSIGNMENT_PAGE_SIZE,
  );

  const ensurePermissionsLoaded = useCallback(async () => {
    if (availablePermissions.length > 0) {
      return availablePermissions;
    }

    const collected: Permission[] = [];
    let page = 0;
    let totalPages = 1;

    do {
      const response = await loadPermissions({ page, size: SECURITY_LOOKUP_PAGE_SIZE });
      collected.push(...response.content);
      totalPages = response.totalPages;
      page += 1;
    } while (page < totalPages);

    const seen = new Set<string>();
    const allPermissions = collected.filter((permission) => {
      if (seen.has(permission.id)) {
        return false;
      }
      seen.add(permission.id);
      return true;
    });

    setAvailablePermissions(allPermissions);
    return allPermissions;
  }, [availablePermissions, loadPermissions]);

  useEffect(() => {
    void loadRoles({ page: currentPage, size: SECURITY_PAGE_SIZE });
  }, [currentPage, loadRoles]);

  useEffect(() => {
    void (async () => {
      await ensurePermissionsLoaded();
    })();
  }, [ensurePermissionsLoaded]);

  const openViewDialog = async (role: Role) => {
    const detailedRole = await getRoleById(role.id) as RoleDetail;
    setSelectedRole(detailedRole);
    setIsDialogOpen(true);
  };

  const openAssignPermissionsDialog = async (role: Role) => {
    const [detailedRole, allPermissions] = await Promise.all([
      getRoleById(role.id) as Promise<RoleDetail>,
      ensurePermissionsLoaded(),
    ]);

    const assignedPermissions = detailedRole.permissions;
    const availablePermissionIds = new Set(allPermissions.map((permission) => permission.id));
    const assignedPermissionIds = assignedPermissions
      .map((permission) => permission.id)
      .filter((permissionId) => availablePermissionIds.has(permissionId));

    setSelectedRole({
      ...detailedRole,
      permissions: assignedPermissions,
    });
    setSelectedPermissionIds(assignedPermissionIds);
    setAssignPermissionsPage(0);
    setIsAssignPermissionsOpen(true);
  };

  const closeAssignPermissionsDialog = () => {
    setIsAssignPermissionsOpen(false);
    setSelectedRole(null);
    setSelectedPermissionIds([]);
    setAssignPermissionsPage(0);
  };

  const togglePermissionSelection = (permissionId: string, checked: boolean) => {
    setSelectedPermissionIds((current) => {
      if (checked) {
        return current.includes(permissionId) ? current : [...current, permissionId];
      }

      return current.filter((currentPermissionId) => currentPermissionId !== permissionId);
    });
  };

  const handleAssignPermissions = async () => {
    if (!selectedRole) {
      return;
    }

    if (selectedPermissionIds.length > 0) {
      await assignMultiplePermissionsToRole({
        roleId: selectedRole.id,
        permissionIds: selectedPermissionIds,
      });
    }

    closeAssignPermissionsDialog();
  };

  const columnHelper = createColumnHelper<Role>();
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("name", {
      header: "Nombre",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("description", {
      header: "Descripcion",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const role = info.row.original;
        return (
          <RowActionsDropdown
            actions={[
              {
                label: "Ver",
                icon: Eye,
                onClick: () => {
                  void openViewDialog(role);
                },
              },
              {
                label: "Asignar permisos",
                icon: ShieldCheck,
                onClick: () => {
                  void openAssignPermissionsDialog(role);
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
      title="Gestion de roles"
      description="Consulta los roles disponibles y su alcance funcional."
    >
      <DataTable
        title="Listado de roles"
        description="Roles cargados desde el servicio de seguridad."
        data={roles}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => {
          void loadRoles({ page: currentPage, size: SECURITY_PAGE_SIZE });
        }}
        pageIndex={currentPage}
        pageSize={SECURITY_PAGE_SIZE}
        pageCount={rolesPage?.totalPages ?? 1}
        totalItems={rolesPage?.totalElements}
        onPageChange={setCurrentPage}
        filterField="name"
        filterPlaceholder="Buscar por nombre"
        emptyMessage="No hay roles disponibles."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-(--security-border)">
          <DialogHeader>
            <DialogTitle>Detalle del rol</DialogTitle>
            <DialogDescription>Informacion del rol seleccionado.</DialogDescription>
          </DialogHeader>

          {selectedRole ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">ID:</span> {selectedRole.id}
              </p>
              <p>
                <span className="font-semibold">Nombre:</span> {selectedRole.name}
              </p>
              <p>
                <span className="font-semibold">Descripcion:</span> {selectedRole.description}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignPermissionsOpen} onOpenChange={setIsAssignPermissionsOpen}>
        <DialogContent className="max-w-4xl border-(--security-border)">
          <DialogHeader>
            <DialogTitle>Asignar permisos</DialogTitle>
            <DialogDescription>
              Marca o desmarca los permisos que deben quedar asociados al rol.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="text-sm text-(--security-muted-foreground)">
              {selectedRole ? (
                <span>
                  Rol seleccionado: <span className="font-medium text-(--security-foreground)">{selectedRole.name}</span>
                </span>
              ) : null}
            </div>

            <div className="rounded-xl border border-(--security-border)">
              <table className="min-w-full text-sm">
                <thead className="bg-(--security-surface)">
                  <tr className="border-b border-(--security-border)">
                    <th className="w-14 px-4 py-3 text-left font-semibold">Sel.</th>
                    <th className="px-4 py-3 text-left font-semibold">Metodo</th>
                    <th className="px-4 py-3 text-left font-semibold">URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--security-border)">
                  {visiblePermissions.map((permission) => {
                    const checked = selectedPermissionIds.includes(permission.id);

                    return (
                      <tr key={permission.id} className="hover:bg-(--security-surface)">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              togglePermissionSelection(permission.id, Boolean(value));
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-(--security-foreground)">{permission.method}</td>
                        <td className="px-4 py-3 text-(--security-muted-foreground)">{permission.url}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-(--security-muted-foreground)">
              <span>
                Pagina {assignPermissionsPage + 1} de {assignPermissionsPageCount}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAssignPermissionsPage((current) => Math.max(0, current - 1));
                  }}
                  disabled={assignPermissionsPage === 0}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAssignPermissionsPage((current) => Math.min(assignPermissionsPageCount - 1, current + 1));
                  }}
                  disabled={assignPermissionsPage >= assignPermissionsPageCount - 1}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAssignPermissionsDialog}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => { void handleAssignPermissions(); }}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
