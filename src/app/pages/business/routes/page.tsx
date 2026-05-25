import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";

import { CrudDialogShell } from "@/app/components/security/crud-dialog-shell";
import { DataTable } from "@/app/components/security/data-table";
import { DialogField } from "@/app/components/security/dialog-field";
import { PageShell } from "@/app/components/security/page-shell";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { BUSINESS_LOOKUP_PAGE_SIZE, BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";
import { TextField, SelectField } from "@/app/components/business/form-fields";
import { toTablePagination } from "@/infra/repository/business/businessPageAdapter";
import { useRoute, useStopAdmin } from "@/hooks/business";
import type { Route, RouteNodeInput } from "@/core/domain/entities/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DialogMode = "create" | "edit" | "view";

interface RouteForm {
  id: string;
  name: string;
  description: string;
  price: string;
  nodes: RouteNodeInput[];
}

const initialForm: RouteForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  nodes: [{ order: 1, stopId: "", estimatedTimeMinutes: 0 }],
};

export default function RoutesPage() {
  const crud = useRoute();
  const stopCrud = useStopAdmin();
  const [form, setForm] = useState<RouteForm>(initialForm);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [stopOptions, setStopOptions] = useState<{ value: string; label: string }[]>([]);

  const pagination = toTablePagination(crud.page?.meta ?? null);

  useEffect(() => {
    void crud.loadItems(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    void stopCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((page) => {
      setStopOptions(page.items.map((s) => ({ value: s.id, label: s.name })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columnHelper = createColumnHelper<Route>();
  const columns = [
    columnHelper.accessor("name", { header: "Nombre" }),
    columnHelper.accessor("description", { header: "Descripción" }),
    columnHelper.accessor("price", { header: "Precio" }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const route = info.row.original;
        return (
          <RowActionsDropdown
            actions={[
              {
                label: "Ver",
                icon: Eye,
                onClick: () => {
                  setForm({
                    id: route.id,
                    name: route.name,
                    description: route.description,
                    price: String(route.price),
                    nodes: [],
                  });
                  setDialogMode("view");
                  setIsDialogOpen(true);
                },
              },
              {
                label: "Actualizar",
                icon: Pencil,
                onClick: () => {
                  setForm({
                    id: route.id,
                    name: route.name,
                    description: route.description,
                    price: String(route.price),
                    nodes: [],
                  });
                  setDialogMode("edit");
                  setIsDialogOpen(true);
                },
              },
              {
                label: "Borrar",
                icon: Trash2,
                variant: "destructive",
                onClick: () => void crud.removeItem(route.id).then(() => crud.loadItems(currentPage)),
              },
            ]}
          />
        );
      },
    }),
  ];

  const handleSave = async () => {
    try {
      if (dialogMode === "edit") {
        await crud.editItem(form.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
        });
      } else if (dialogMode === "create") {
        await crud.addItem({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          nodes: form.nodes
            .filter((n) => n.stopId)
            .map((n) => ({
              order: n.order,
              stopId: n.stopId,
              estimatedTimeMinutes: Math.max(0, Math.round(n.estimatedTimeMinutes)),
            })),
        });
      }
      setIsDialogOpen(false);
      await crud.loadItems(currentPage);
    } catch {
      // handled in store
    }
  };

  return (
    <PageShell title="Rutas" description="Administra rutas y sus paradas.">
      <DataTable
        title="Listado de rutas"
        description="Rutas del sistema."
        data={crud.items}
        columns={columns}
        loading={crud.loading}
        error={crud.error}
        onRefresh={() => void crud.loadItems(currentPage)}
        pageIndex={currentPage}
        pageSize={BUSINESS_PAGE_SIZE}
        pageCount={pagination.pageCount}
        totalItems={pagination.totalItems}
        onPageChange={setCurrentPage}
        filterField="name"
        toolbarAction={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setForm(initialForm);
              setDialogMode("create");
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" />
            Adicionar
          </Button>
        }
      />

      <CrudDialogShell
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        title={dialogMode === "create" ? "Adicionar ruta" : dialogMode === "edit" ? "Actualizar ruta" : "Detalle de ruta"}
        description="Configure la ruta y, al crear, asigne paradas en orden."
        onClose={() => { setIsDialogOpen(false); }}
        onSave={() => void handleSave()}
      >
        <TextField id="name" label="Nombre" value={form.name} onChange={(v) => { setForm((c) => ({ ...c, name: v })); }} disabled={dialogMode === "view"} />
        <TextField id="description" label="Descripción" value={form.description} onChange={(v) => { setForm((c) => ({ ...c, description: v })); }} disabled={dialogMode === "view"} />
        <TextField id="price" label="Precio" value={form.price} onChange={(v) => { setForm((c) => ({ ...c, price: v })); }} disabled={dialogMode === "view"} type="number" />

        {dialogMode === "create" ? (
          <RouteNodesEditor nodes={form.nodes} stopOptions={stopOptions} setForm={setForm} />
        ) : null}
      </CrudDialogShell>
    </PageShell>
  );
}

function RouteNodesEditor({
  nodes,
  stopOptions,
  setForm,
}: {
  nodes: RouteNodeInput[];
  stopOptions: { value: string; label: string }[];
  setForm: React.Dispatch<React.SetStateAction<RouteForm>>;
}) {
  const updateNode = (index: number, patch: Partial<RouteNodeInput>) => {
    setForm((c) => ({
      ...c,
      nodes: c.nodes.map((n, i) => (i === index ? { ...n, ...patch } : n)),
    }));
  };

  const removeNode = (index: number) => {
    setForm((c) => ({ ...c, nodes: c.nodes.filter((_, i) => i !== index) }));
  };

  const addNode = () => {
    setForm((c) => ({
      ...c,
      nodes: [...c.nodes, { order: c.nodes.length + 1, stopId: "", estimatedTimeMinutes: 0 }],
    }));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Paradas de la ruta</p>
      {nodes.map((node, index) => (
        <RouteNodesEditorRow
          key={index}
          node={node}
          index={index}
          stopOptions={stopOptions}
          updateNode={updateNode}
          removeNode={removeNode}
        />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addNode}>
        Agregar parada
      </Button>
    </div>
  );
}

function RouteNodesEditorRow({
  node,
  index,
  stopOptions,
  updateNode,
  removeNode,
}: {
  node: RouteNodeInput;
  index: number;
  stopOptions: { value: string; label: string }[];
  updateNode: (index: number, patch: Partial<RouteNodeInput>) => void;
  removeNode: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
      <DialogField label="Orden" htmlFor={`order-${String(index)}`}>
        <Input
          id={`order-${String(index)}`}
          type="number"
          value={node.order}
          onChange={(e) => { updateNode(index, { order: Number(e.target.value) }); }}
        />
      </DialogField>
      <DialogField label="Tiempo (min)" htmlFor={`time-${String(index)}`}>
        <Input
          id={`time-${String(index)}`}
          type="number"
          min={0}
          step={1}
          value={node.estimatedTimeMinutes}
          onChange={(e) => {
            updateNode(index, { estimatedTimeMinutes: Math.max(0, Math.round(Number(e.target.value) || 0)) });
          }}
        />
      </DialogField>
      <div className="min-w-[200px] flex-1">
        <SelectField
          label="Parada"
          value={node.stopId}
          onChange={(v) => { updateNode(index, { stopId: v }); }}
          options={stopOptions}
        />
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => { removeNode(index); }}>
        Quitar
      </Button>
    </div>
  );
}
