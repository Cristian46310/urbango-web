import { useEffect, useState } from "react";
import { Eye, MoreVertical } from "lucide-react";
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
import { useRole } from "@/hooks/security";

interface RoleRow {
  id: string;
  name: string;
  description: string;
}

export default function RolesPage() {
  const { roles, loading, error, loadRoles } = useRole();

  const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void loadRoles();
  }, []);

  const openViewDialog = (role: RoleRow) => {
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  const columnHelper = createColumnHelper<RoleRow>();
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
                <DropdownMenuItem onClick={() => { openViewDialog(role); }}>
                  <Eye className="size-4" />
                  Ver
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
          void loadRoles();
        }}
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
    </PageShell>
  );
}
