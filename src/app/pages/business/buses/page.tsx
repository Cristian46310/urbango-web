import { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { SelectField, TextField } from "@/app/components/business/form-fields";
import { useBus, useEnterprise } from "@/hooks/business";
import { BUSINESS_LOOKUP_PAGE_SIZE } from "@/app/components/business/constants";
import type { Bus } from "@/core/domain/entities/business";

interface BusForm {
  id: string;
  plate: string;
  model: string;
  color: string;
  capacity: string;
  enterpriseId: string;
}

const initialForm: BusForm = {
  id: "",
  plate: "",
  model: "",
  color: "",
  capacity: "",
  enterpriseId: "",
};
const columnHelper = createColumnHelper<Bus>();

function buildPayload(form: BusForm) {
  return {
    plate: form.plate.trim(),
    model: form.model.trim(),
    color: form.color.trim(),
    capacity: Number(form.capacity),
    enterpriseId: form.enterpriseId,
  };
}

export default function BusesPage() {
  const crud = useBus();
  const enterpriseCrud = useEnterprise();
  const [enterpriseOptions, setEnterpriseOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    void enterpriseCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((page) => {
      setEnterpriseOptions(
        page.items.map((e) => ({ value: e.id, label: `${e.name} (${e.nit})` })),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BusinessCrudPage
      title="Buses"
      description="Administra la flota de buses."
      tableTitle="Listado de buses"
      tableDescription="Buses registrados por empresa."
      entityLabel="bus"
      filterField="plate"
      items={crud.items}
      page={crud.page}
      loading={crud.loading}
      error={crud.error}
      loadItems={crud.loadItems}
      addItem={crud.addItem}
      editItem={crud.editItem}
      removeItem={crud.removeItem}
      initialForm={initialForm}
      mapToForm={(e) => ({
        id: e.id,
        plate: e.plate,
        model: e.model,
        color: e.color,
        capacity: String(e.capacity),
        enterpriseId: e.enterpriseId ?? "",
      })}
      getId={(f) => f.id}
      buildCreatePayload={buildPayload}
      buildUpdatePayload={buildPayload}
      columns={[
        columnHelper.accessor("plate", { header: "Placa" }),
        columnHelper.accessor("model", { header: "Modelo" }),
        columnHelper.accessor("capacity", { header: "Capacidad" }),
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          <TextField id="plate" label="Placa" value={form.plate} onChange={(v) => { setForm((c) => ({ ...c, plate: v })); }} disabled={mode === "view"} />
          <TextField id="model" label="Modelo" value={form.model} onChange={(v) => { setForm((c) => ({ ...c, model: v })); }} disabled={mode === "view"} />
          <TextField id="color" label="Color" value={form.color} onChange={(v) => { setForm((c) => ({ ...c, color: v })); }} disabled={mode === "view"} />
          <TextField id="capacity" label="Capacidad" value={form.capacity} onChange={(v) => { setForm((c) => ({ ...c, capacity: v })); }} disabled={mode === "view"} type="number" />
          <SelectField
            label="Empresa"
            value={form.enterpriseId}
            onChange={(v) => { setForm((c) => ({ ...c, enterpriseId: v })); }}
            disabled={mode === "view"}
            options={enterpriseOptions}
            placeholder="Seleccione empresa"
          />
        </>
      )}
    />
  );
}
