import { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { formatShortId } from "@/app/components/business/constants";
import { SelectField, TextField } from "@/app/components/business/form-fields";
import { BUSINESS_LOOKUP_PAGE_SIZE } from "@/app/components/business/constants";
import { useNode, useRoute, useStopAdmin } from "@/hooks/business";
import type { Node } from "@/core/domain/entities/business";
import { isUuid } from "@/lib/uuid";
import { showErrorToast } from "@/lib/toast";

interface NodeForm {
  id: string;
  routeId: string;
  stopId: string;
  order: string;
}

const initialForm: NodeForm = { id: "", routeId: "", stopId: "", order: "1" };
const columnHelper = createColumnHelper<Node>();

export default function NodesPage() {
  const crud = useNode();
  const routeCrud = useRoute();
  const stopCrud = useStopAdmin();
  const [routeOptions, setRouteOptions] = useState<{ value: string; label: string }[]>([]);
  const [stopOptions, setStopOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    void routeCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setRouteOptions(p.items.map((r) => ({ value: r.id, label: r.name })));
    });
    void stopCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setStopOptions(p.items.map((s) => ({ value: s.id, label: s.name })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (id: string) => {
    const node = crud.items.find((item) => item.id === id);
    if (node) {
      const siblings = crud.items.filter((item) => item.routeId === node.routeId);
      if (siblings.length <= 3) {
        showErrorToast("No se puede borrar: la ruta quedaría con menos de 3 paradas");
        return;
      }
    }
    await crud.removeItem(id);
    await crud.loadItems();
  };

  return (
    <BusinessCrudPage
      title="Nodos"
      description="Vincula paradas a rutas con un orden. Tras borrar, el backend resecuancia; mínimo 3 nodos por ruta."
      tableTitle="Listado de nodos"
      tableDescription="Nodos ruta-parada."
      entityLabel="nodo"
      items={crud.items}
      page={crud.page}
      loading={crud.loading}
      error={crud.error}
      loadItems={crud.loadItems}
      addItem={async (payload) => {
        if (!isUuid(payload.routeId) || !isUuid(payload.stopId)) {
          showErrorToast("Ruta y parada deben ser UUID válidos");
          throw new Error("UUID inválido");
        }
        return crud.addItem(payload);
      }}
      editItem={crud.editItem}
      removeItem={handleRemove}
      initialForm={initialForm}
      mapToForm={(e) => ({
        id: e.id,
        routeId: e.routeId,
        stopId: e.stopId,
        order: String(e.order),
      })}
      getId={(f) => f.id}
      buildCreatePayload={(f) => ({
        routeId: f.routeId,
        stopId: f.stopId,
        order: Number(f.order),
      })}
      buildUpdatePayload={(f) => ({ order: Number(f.order) })}
      columns={[
        columnHelper.accessor("routeId", {
          header: "Ruta",
          cell: (i) => formatShortId(String(i.getValue())),
        }),
        columnHelper.accessor("stopId", {
          header: "Parada",
          cell: (i) => formatShortId(String(i.getValue())),
        }),
        columnHelper.accessor("order", { header: "Orden" }),
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          {mode === "create" ? (
            <>
              <SelectField
                label="Ruta"
                value={form.routeId}
                onChange={(v) => { setForm((c) => ({ ...c, routeId: v })); }}
                options={routeOptions}
              />
              <SelectField
                label="Parada"
                value={form.stopId}
                onChange={(v) => { setForm((c) => ({ ...c, stopId: v })); }}
                options={stopOptions}
              />
            </>
          ) : null}
          <TextField
            id="order"
            label="Orden"
            value={form.order}
            onChange={(v) => { setForm((c) => ({ ...c, order: v })); }}
            disabled={mode === "view"}
            type="number"
          />
        </>
      )}
    />
  );
}
