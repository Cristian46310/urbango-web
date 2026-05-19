import { useEffect, useState, type ReactNode } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { BusinessPage } from "@/core/types/BusinessPage";

import { CrudDialogShell } from "@/app/components/security/crud-dialog-shell";
import { DataTable } from "@/app/components/security/data-table";
import { PageShell } from "@/app/components/security/page-shell";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";
import { toTablePagination } from "@/infra/repository/business/businessPageAdapter";
import { Button } from "@/components/ui/button";

type DialogMode = "create" | "edit" | "view";

interface BusinessCrudPageProps<T extends { id: string }, TForm, CreateDto, UpdateDto> {
  title: string;
  description: string;
  tableTitle: string;
  tableDescription: string;
  entityLabel: string;
  filterField?: string;
  filterPlaceholder?: string;
  items: T[];
  page: BusinessPage<T> | null;
  loading: boolean;
  error: string | null;
  loadItems: (pageIndex: number) => Promise<BusinessPage<T>>;
  addItem: (data: CreateDto) => Promise<T>;
  editItem: (id: string, data: UpdateDto) => Promise<T>;
  removeItem: (id: string) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  initialForm: TForm;
  mapToForm: (entity: T) => TForm;
  getId: (form: TForm) => string;
  renderForm: (
    form: TForm,
    setForm: React.Dispatch<React.SetStateAction<TForm>>,
    mode: DialogMode,
  ) => ReactNode;
  buildCreatePayload: (form: TForm) => CreateDto;
  buildUpdatePayload: (form: TForm) => UpdateDto;
}

export function BusinessCrudPage<T extends { id: string }, TForm, CreateDto, UpdateDto>({
  title,
  description,
  tableTitle,
  tableDescription,
  entityLabel,
  filterField,
  filterPlaceholder,
  items,
  page,
  loading,
  error,
  loadItems,
  addItem,
  editItem,
  removeItem,
  columns: baseColumns,
  initialForm,
  mapToForm,
  getId,
  renderForm,
  buildCreatePayload,
  buildUpdatePayload,
}: BusinessCrudPageProps<T, TForm, CreateDto, UpdateDto>) {
  const [form, setForm] = useState<TForm>(initialForm);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const pagination = toTablePagination(page?.meta ?? null);

  useEffect(() => {
    void loadItems(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const reload = () => loadItems(currentPage);

  const openCreate = () => {
    setForm(initialForm);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEdit = (entity: T) => {
    setForm(mapToForm(entity));
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const openView = (entity: T) => {
    setForm(mapToForm(entity));
    setDialogMode("view");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (dialogMode === "edit") {
        await editItem(getId(form), buildUpdatePayload(form));
      } else if (dialogMode === "create") {
        await addItem(buildCreatePayload(form));
      }
      setIsDialogOpen(false);
      setForm(initialForm);
      await reload();
    } catch {
      // store handles toasts
    }
  };

  const handleDelete = async (id: string) => {
    await removeItem(id);
    await reload();
  };

  const columnHelper = createColumnHelper<T>();
  const columns = [
    ...baseColumns,
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const entity = info.row.original;
        return (
          <RowActionsDropdown
            actions={[
              { label: "Ver", icon: Eye, onClick: () => { openView(entity); } },
              { label: "Actualizar", icon: Pencil, onClick: () => { openEdit(entity); } },
              {
                label: "Borrar",
                icon: Trash2,
                variant: "destructive",
                onClick: () => void handleDelete(entity.id),
              },
            ]}
          />
        );
      },
    }),
  ];

  return (
    <PageShell title={title} description={description}>
      <DataTable
        title={tableTitle}
        description={tableDescription}
        data={items}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => void reload()}
        pageIndex={currentPage}
        pageSize={BUSINESS_PAGE_SIZE}
        pageCount={pagination.pageCount}
        totalItems={pagination.totalItems}
        onPageChange={setCurrentPage}
        filterField={filterField}
        filterPlaceholder={filterPlaceholder}
        emptyMessage={`No hay ${entityLabel} registrados.`}
        toolbarAction={
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Adicionar
          </Button>
        }
      />

      <CrudDialogShell
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        title={
          dialogMode === "create"
            ? `Adicionar ${entityLabel}`
            : dialogMode === "edit"
              ? `Actualizar ${entityLabel}`
              : `Detalle de ${entityLabel}`
        }
        description={
          dialogMode === "view"
            ? `Información del ${entityLabel} seleccionado.`
            : `Complete los campos del ${entityLabel}.`
        }
        onClose={() => { setIsDialogOpen(false); }}
        onSave={() => void handleSave()}
      >
        {renderForm(form, setForm, dialogMode)}
      </CrudDialogShell>
    </PageShell>
  );
}
