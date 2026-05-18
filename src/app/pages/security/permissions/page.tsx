import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";

import { CrudDialogShell } from "@/app/components/security/crud-dialog-shell";
import { DataTable } from "@/app/components/security/data-table";
import { DialogField } from "@/app/components/security/dialog-field";
import { PageShell } from "@/app/components/security/page-shell";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { SECURITY_PAGE_SIZE } from "@/app/components/security/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermission } from "@/hooks/security";
import type { Permission } from "@/core/domain/entities/security/Permission";

type PermissionDialogMode = "create" | "edit" | "view";

interface PermissionForm {
  id: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
}

const initialForm: PermissionForm = {
  id: "",
  url: "",
  method: "GET",
};

export default function PermissionsPage() {
  const {
    permissions,
    permissionsPage,
    loading,
    error,
    loadPermissions,
    addPermission,
    editPermission,
    removePermission,
  } = usePermission();

  const [form, setForm] = useState<PermissionForm>(initialForm);
  const [dialogMode, setDialogMode] = useState<PermissionDialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    void loadPermissions({ page: currentPage, size: SECURITY_PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const openCreateDialog = () => {
    setForm(initialForm);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (permission: Permission) => {
    setForm(permission);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const openViewDialog = (permission: Permission) => {
    setForm(permission);
    setDialogMode("view");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (dialogMode === "edit") {
        await editPermission(form.id, {
          url: form.url.trim(),
          method: form.method,
        });
      } else {
        await addPermission({
          url: form.url.trim(),
          method: form.method,
        });
      }

      setIsDialogOpen(false);
      setForm(initialForm);
      await loadPermissions({ page: currentPage, size: SECURITY_PAGE_SIZE });
    } catch {
      // Store layer handles user feedback and validation.
    }
  };

  const handleDelete = async (permissionId: string) => {
    await removePermission(permissionId);
    await loadPermissions({ page: currentPage, size: SECURITY_PAGE_SIZE });
  };

  const columnHelper = createColumnHelper<Permission>();
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("url", {
      header: "URL",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("method", {
      header: "Metodo",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const permission = info.row.original;
        return (
          <RowActionsDropdown
            actions={[
              {
                label: "Ver",
                icon: Eye,
                onClick: () => {
                  openViewDialog(permission);
                },
              },
              {
                label: "Actualizar",
                icon: Pencil,
                onClick: () => {
                  openEditDialog(permission);
                },
              },
              {
                label: "Borrar",
                icon: Trash2,
                variant: "destructive",
                onClick: () => {
                  void handleDelete(permission.id);
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
      title="Gestion de permisos"
      description="Administra rutas y metodos HTTP de manera organizada."
    >
      <DataTable
        title="Listado de permisos"
        description="Permisos registrados para el sistema."
        data={permissions}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => {
          void loadPermissions({ page: currentPage, size: SECURITY_PAGE_SIZE });
        }}
        pageIndex={currentPage}
        pageSize={SECURITY_PAGE_SIZE}
        pageCount={permissionsPage?.totalPages ?? 1}
        totalItems={permissionsPage?.totalElements}
        onPageChange={setCurrentPage}
        filterField="url"
        filterPlaceholder="Buscar por URL"
        emptyMessage="No hay permisos creados."
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
        title={dialogMode === "create" ? "Adicionar permiso" : dialogMode === "edit" ? "Actualizar permiso" : "Detalle del permiso"}
        description={dialogMode === "view" ? "Informacion del permiso seleccionado." : "Configura la ruta y el metodo HTTP."}
        onClose={() => {
          setIsDialogOpen(false);
        }}
        onSave={() => {
          void handleSave();
        }}
      >
        <DialogField label="URL" htmlFor="permission-url">
          <Input
            id="permission-url"
            value={form.url}
            onChange={(event) => {
              setForm((current) => ({ ...current, url: event.target.value }));
            }}
            disabled={dialogMode === "view"}
          />
        </DialogField>

        <DialogField label="Metodo">
          <Select
            value={form.method}
            onValueChange={(value: PermissionForm["method"]) => {
              setForm((current) => ({ ...current, method: value }));
            }}
            disabled={dialogMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un metodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </DialogField>
      </CrudDialogShell>
    </PageShell>
  );
}
