import { useCallback, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/app/components/security/data-table";
import { PageShell } from "@/app/components/security/page-shell";
import { CrudDialogShell } from "@/app/components/security/crud-dialog-shell";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { SelectField } from "@/app/components/business/form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PaymentMethod } from "@/core/domain/entities/business";
import {
  myPaymentMethodCitizenRepository,
  type CitizenPaymentMethodOption,
} from "@/infra/repository/paymentMethodCitizen";
import { paymentMethodCitizenRepository as adminPaymentMethodCitizenRepository } from "@/infra/repository/business/repositories";
import { formatCop } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const columnHelper = createColumnHelper<CitizenPaymentMethodOption>();

export default function PaymentMethodCitizensPage() {
  const [items, setItems] = useState<CitizenPaymentMethodOption[]>([]);
  const [catalog, setCatalog] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mine, methods] = await Promise.all([
        myPaymentMethodCitizenRepository.listMine(),
        myPaymentMethodCitizenRepository.listCatalog(),
      ]);
      setItems(mine);
      setCatalog(methods);
    } catch (err) {
      const message = getApiErrorMessage(err, "No se pudieron cargar tus métodos de pago");
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const availableOptions = useMemo(() => {
    const linkedIds = new Set(items.map((item) => item.paymentMethodId).filter(Boolean));
    return catalog
      .filter((method) => !linkedIds.has(method.id))
      .map((method) => ({ value: method.id, label: method.name }));
  }, [catalog, items]);

  const openCreate = () => {
    setPaymentMethodId("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDiscardOpen(false);
    setPaymentMethodId("");
  };

  const requestClose = () => {
    if (saving) return;
    if (paymentMethodId) {
      setDiscardOpen(true);
      return;
    }
    closeDialog();
  };

  const handleSave = async () => {
    if (!paymentMethodId) {
      showErrorToast("Selecciona un método de pago");
      return;
    }

    setSaving(true);
    try {
      await myPaymentMethodCitizenRepository.linkMine({ paymentMethodId });
      showSuccessToast("Método de pago añadido");
      closeDialog();
      await loadData();
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo añadir el método de pago"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminPaymentMethodCitizenRepository.delete(id);
      showSuccessToast("Método de pago eliminado");
      await loadData();
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, "No se pudo eliminar el método de pago"));
    }
  };

  const columns = [
    columnHelper.accessor((row) => row.name ?? row.label, {
      id: "method",
      header: "Método",
      cell: (info) => info.getValue() || "—",
    }),
    columnHelper.accessor("balance", {
      header: "Saldo",
      cell: (info) => {
        const row = info.row.original;
        if (row.isRechargeable || row.code === "SYSTEM_CARD") {
          return formatCop(info.getValue() ?? 0);
        }
        return "—";
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActionsDropdown
          actions={[
            {
              label: "Borrar",
              icon: Trash2,
              variant: "destructive",
              onClick: () => void handleDelete(row.original.id),
            },
          ]}
        />
      ),
    }),
  ];

  return (
    <PageShell
      title="Pagos por ciudadano"
      description="Añade a tu cuenta los métodos de pago del catálogo. El vínculo queda asociado a tu sesión."
    >
      <DataTable
        title="Listado"
        description="Métodos de pago vinculados a tu cuenta."
        data={items}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => void loadData()}
        emptyMessage="Aún no has añadido ningún método de pago"
        emptyIcon={
          <CreditCard className="size-11 text-slate-300" strokeWidth={1.5} aria-hidden />
        }
        toolbarAction={
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            disabled={loading || availableOptions.length === 0}
            className="bg-teal-700 text-white hover:bg-teal-600"
          >
            <Plus className="mr-1 size-4" />
            Añadir método de pago
          </Button>
        }
      />

      <CrudDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        mode="create"
        title="Añadir método de pago"
        description="Selecciona el método de pago que quieres vincular a tu cuenta"
        onClose={requestClose}
        onSave={() => void handleSave()}
        saveLabel="Guardar"
        saving={saving}
        saveDisabled={!paymentMethodId || availableOptions.length === 0}
      >
        {availableOptions.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Ya tienes vinculados todos los métodos disponibles del catálogo.
          </p>
        ) : (
          <SelectField
            label="Método de pago"
            value={paymentMethodId}
            onChange={setPaymentMethodId}
            options={availableOptions}
            placeholder="Selecciona un método"
          />
        )}
        {saving ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Guardando...
          </p>
        ) : null}
      </CrudDialogShell>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Descartar este método?</DialogTitle>
            <DialogDescription>
              Perderás la selección que ya hiciste.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setDiscardOpen(false); }}
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
