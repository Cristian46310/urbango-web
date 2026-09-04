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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DialogMode = "create" | "edit" | "view";

interface BusinessCrudPageProps<T extends { id: string }, TForm, CreateDto, UpdateDto> {
  title: string;
  description: string;
  tableTitle: string;
  tableDescription: string;
  entityLabel: string;
  filterField?: string;
  filterPlaceholder?: string;
  emptyMessage?: string;
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
  validateForm?: (form: TForm, mode: DialogMode) => boolean;
  isFormDirty?: (
    form: TForm,
    initialForm: TForm,
    mode: DialogMode,
  ) => boolean;
  isSaveDisabled?: (form: TForm, mode: DialogMode) => boolean;
  saveLabel?: string;
  onDialogOpen?: () => void;
  /** Passed to CrudDialogShell DialogContent (e.g. sm:max-w-4xl for map forms). */
  dialogContentClassName?: string;
}

export function BusinessCrudPage<T extends { id: string }, TForm, CreateDto, UpdateDto>({
  title,
  description,
  tableTitle,
  tableDescription,
  entityLabel,
  filterField,
  filterPlaceholder,
  emptyMessage,
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
  validateForm,
  isFormDirty,
  isSaveDisabled,
  saveLabel = "Guardar",
  onDialogOpen,
  dialogContentClassName,
}: BusinessCrudPageProps<T, TForm, CreateDto, UpdateDto>) {
  const [form, setForm] = useState<TForm>(initialForm);
  const [formBaseline, setFormBaseline] = useState<TForm>(initialForm);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const pagination = toTablePagination(page?.meta ?? null);

  useEffect(() => {
    void loadItems(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const reload = () => loadItems(currentPage);

  const formIsDirty =
    dialogMode === "view"
      ? false
      : isFormDirty
        ? isFormDirty(form, formBaseline, dialogMode)
        : true;

  const saveDisabled =
    (isSaveDisabled?.(form, dialogMode) ?? false) ||
    (dialogMode === "edit" && isFormDirty != null && !formIsDirty);

  const showSave =
    dialogMode === "create" ||
    dialogMode === "edit" && (isFormDirty == null || formIsDirty || saving);

  const openCreate = () => {
    onDialogOpen?.();
    setForm(initialForm);
    setFormBaseline(initialForm);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEdit = (entity: T) => {
    onDialogOpen?.();
    const mappedForm = mapToForm(entity);
    setForm(mappedForm);
    setFormBaseline(mappedForm);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const openView = (entity: T) => {
    onDialogOpen?.();
    const mappedForm = mapToForm(entity);
    setForm(mappedForm);
    setFormBaseline(mappedForm);
    setDialogMode("view");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setDiscardDialogOpen(false);
    setForm(initialForm);
  };

  const requestClose = () => {
    if (saving) return;
    if (
      dialogMode !== "view" &&
      isFormDirty?.(form, formBaseline, dialogMode)
    ) {
      setDiscardDialogOpen(true);
      return;
    }
    closeDialog();
  };

  const handleSave = async () => {
    if (validateForm && !validateForm(form, dialogMode)) {
      return;
    }

    setSaving(true);
    try {
      if (dialogMode === "edit") {
        await editItem(getId(form), buildUpdatePayload(form));
      } else if (dialogMode === "create") {
        await addItem(buildCreatePayload(form));
      }
      closeDialog();
      await reload();
    } catch {
      // store handles toasts
    } finally {
      setSaving(false);
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
        emptyMessage={emptyMessage ?? `No hay ${entityLabel} registrados.`}
        toolbarAction={
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            className="bg-teal-700 text-white hover:bg-teal-600"
          >
            <Plus className="mr-1 size-4" />
            Adicionar
          </Button>
        }
      />

      <CrudDialogShell
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
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
        onClose={requestClose}
        onSave={() => void handleSave()}
        saveLabel={saveLabel}
        saving={saving}
        saveDisabled={saveDisabled}
        showSave={showSave}
        contentClassName={dialogContentClassName}
      >
        {renderForm(form, setForm, dialogMode)}
      </CrudDialogShell>

      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Descartar este {entityLabel}?</DialogTitle>
            <DialogDescription>
              Perderás los datos que ya diligenciaste.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDiscardDialogOpen(false);
              }}
            >
              Seguir editando
            </Button>
            <Button type="button" variant="destructive" onClick={closeDialog}>
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
