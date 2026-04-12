import { useEffect, useState } from "react";
import { Eye, MoreVertical, ShieldCheck } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";

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
import { usePermission, useRole, useRolePermission } from "@/hooks/security";
import type { Permission } from "@/core/domain/entities/security/Permission";
import type { Role } from "@/core/domain/entities/security/Role";

const PAGE_SIZE = 10;
const LOOKUP_PAGE_SIZE = 10;

interface RoleDetail extends Role {
  permissions: Permission[];
}

export default function RolesPage() {
  const { roles, rolesPage, loading, error, loadRoles, getRoleById } = useRole();
  const { permissions, loadPermissions } = usePermission();
  const { assignPermissionToRole, removePermissionRoleLink } = useRolePermission();

  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignPermissionsOpen, setIsAssignPermissionsOpen] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    void loadRoles({ page: currentPage, size: PAGE_SIZE });
  }, [currentPage]);

  useEffect(() => {
    void loadPermissions({ page: 0, size: LOOKUP_PAGE_SIZE });
  }, []);

  const openViewDialog = async (role: Role) => {
    const detailedRole = await getRoleById(role.id) as RoleDetail;
    setSelectedRole(detailedRole);
    setIsDialogOpen(true);
  };

  const openAssignPermissionsDialog = async (role: Role) => {
    const detailedRole = await getRoleById(role.id) as RoleDetail;
    const assignedPermissions = detailedRole.permissions;
    setSelectedRole({
      ...detailedRole,
      permissions: assignedPermissions,
    });
    setSelectedPermissionIds(assignedPermissions.map((permission) => permission.id));
    setIsAssignPermissionsOpen(true);
  };

  const closeAssignPermissionsDialog = () => {
    setIsAssignPermissionsOpen(false);
    setSelectedRole(null);
    setSelectedPermissionIds([]);
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
      toast.error("Selecciona un rol.");
      return;
    }

    const currentPermissionIds = (selectedRole.permissions ?? []).map((permission) => permission.id);
    const permissionsToAdd = selectedPermissionIds.filter(
      (permissionId) => !currentPermissionIds.includes(permissionId),
    );
    const permissionsToRemove = (selectedRole.permissions ?? []).filter(
      (permission) => !selectedPermissionIds.includes(permission.id),
    );

    for (const permissionId of permissionsToAdd) {
      await assignPermissionToRole(selectedRole.id, permissionId);
    }

    const removablePermissions = permissionsToRemove.filter((permission) => Boolean(permission.relationId));
    if (permissionsToRemove.length > removablePermissions.length) {
      toast.error("No se pudieron quitar algunos permisos porque el backend no expone el id de relacion.");
    }

    for (const permission of removablePermissions) {
      await removePermissionRoleLink(permission.relationId as string);
    }

    await loadRoles({ page: currentPage, size: PAGE_SIZE });
    closeAssignPermissionsDialog();
    toast.success("Permisos actualizados correctamente");
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
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Opciones">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { void openViewDialog(role); }}>
                  <Eye className="size-4" />
                  Ver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { void openAssignPermissionsDialog(role); }}>
                  <ShieldCheck className="size-4" />
                  Asignar permisos
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
      title="Gestion de roles"
      description="Consulta los roles disponibles y su alcance funcional."
      aside={
        <div className="space-y-3">
          <p>Este modulo es solo de consulta en el backend actual.</p>
          <p>Si necesitas cambios de roles, debes habilitar esas operaciones en el servicio.</p>
        </div>
      }
    >
      <DataTable
        title="Listado de roles"
        description="Roles cargados desde el servicio de seguridad."
        data={roles}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => {
          void loadRoles({ page: currentPage, size: PAGE_SIZE });
        }}
        pageIndex={currentPage}
        pageSize={PAGE_SIZE}
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
                  {permissions.map((permission) => {
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
