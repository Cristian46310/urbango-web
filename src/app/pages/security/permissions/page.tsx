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
  const { permissions, loading, error, loadPermissions, addPermission, editPermission, removePermission } = usePermission();

  const [form, setForm] = useState<PermissionForm>(initialForm);
  const [dialogMode, setDialogMode] = useState<PermissionDialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void loadPermissions();
  }, []);

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
      if (!form.url.trim()) {
        throw new Error("La URL es obligatoria.");
      }

      if (dialogMode === "edit") {
        await editPermission(form.id, {
          url: form.url.trim(),
          method: form.method,
        });
        toast.success("Permiso actualizado correctamente");
      } else {
        await addPermission({
          url: form.url.trim(),
          method: form.method,
        });
        toast.success("Permiso creado correctamente");
      }

      setIsDialogOpen(false);
      setForm(initialForm);
      await loadPermissions();
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  const handleDelete = async (permissionId: string) => {
    await removePermission(permissionId);
    await loadPermissions();
    toast.success("Permiso eliminado");
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
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Opciones">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { openViewDialog(permission); }}>
                  <Eye className="size-4" />
                  Ver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { openEditDialog(permission); }}>
                  <Pencil className="size-4" />
                  Actualizar
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => { void handleDelete(permission.id); }}>
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
      title="Gestion de permisos"
      description="Administra rutas y metodos HTTP de manera organizada."
      aside={
        <div className="space-y-3">
          <p>Los permisos definen que endpoints puede consumir cada rol.</p>
          <p>Usa la opcion de adicionar para registrar nuevas reglas.</p>
        </div>
      }
    >
      <DataTable
        title="Listado de permisos"
        description="Permisos registrados para el sistema."
        data={permissions}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => {
          void loadPermissions();
        }}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-(--security-border)">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Adicionar permiso" : dialogMode === "edit" ? "Actualizar permiso" : "Detalle del permiso"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "view" ? "Informacion del permiso seleccionado." : "Configura la ruta y el metodo HTTP."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="permission-url">URL</Label>
              <Input
                id="permission-url"
                value={form.url}
                onChange={(event) => {
                  setForm((current) => ({ ...current, url: event.target.value }));
                }}
                disabled={dialogMode === "view"}
              />
            </div>

            <div className="grid gap-2">
              <Label>Metodo</Label>
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
