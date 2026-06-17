import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { SelectField, TextField } from "@/app/components/business/form-fields";
import { useBus } from "@/hooks/business";
import {
  BUS_STATUS_LABELS,
  BUS_STATUS_OPTIONS,
  type Bus,
  type BusStatus,
} from "@/core/domain/entities/business/Bus";

interface BusForm {
  id: string;
  plate: string;
  color: string;
  model: string;
  year: string;
  seatedCapacity: string;
  standingCapacity: string;
  status: BusStatus;
}

const initialForm: BusForm = {
  id: "",
  plate: "",
  color: "",
  model: "",
  year: String(new Date().getFullYear()),
  seatedCapacity: "",
  standingCapacity: "",
  status: "operativo",
};

const statusOptions = BUS_STATUS_OPTIONS.map((value) => ({
  value,
  label: BUS_STATUS_LABELS[value],
}));

const columnHelper = createColumnHelper<Bus>();

function buildPayload(form: BusForm) {
  return {
    plate: form.plate.trim().toUpperCase(),
    color: form.color.trim(),
    model: form.model.trim(),
    year: Number(form.year),
    seatedCapacity: Number(form.seatedCapacity),
    standingCapacity: Number(form.standingCapacity),
    status: form.status,
  };
}

function totalCapacity(bus: Bus) {
  const seated = bus.seatedCapacity ?? 0;
  const standing = bus.standingCapacity ?? 0;
  const sum = seated + standing;
  return sum > 0 ? sum : bus.capacity;
}

export default function BusesPage() {
  const crud = useBus();

  return (
    <BusinessCrudPage
      title="Buses"
      description="Administra la flota de buses."
      tableTitle="Listado de buses"
      tableDescription="Buses registrados."
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
        color: e.color ?? "",
        model: e.model ?? "",
        year: String(e.year ?? new Date().getFullYear()),
        seatedCapacity: String(e.seatedCapacity ?? ""),
        standingCapacity: String(e.standingCapacity ?? ""),
        status: e.status ?? "operativo",
      })}
      getId={(f) => f.id}
      buildCreatePayload={buildPayload}
      buildUpdatePayload={buildPayload}
      columns={[
        columnHelper.accessor("plate", { header: "Placa" }),
        columnHelper.accessor("color", { header: "Color" }),
        columnHelper.accessor("model", { header: "Modelo" }),
        columnHelper.accessor("year", { header: "Año" }),
        columnHelper.display({
          id: "capacity",
          header: "Capacidad",
          cell: (info) => {
            const total = totalCapacity(info.row.original);
            return total != null ? String(total) : "—";
          },
        }),
        columnHelper.accessor("status", {
          header: "Estado",
          cell: (info) => BUS_STATUS_LABELS[info.getValue() as BusStatus] ?? info.getValue(),
        }),
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          <TextField
            id="plate"
            label="Placa"
            value={form.plate}
            onChange={(v) => { setForm((c) => ({ ...c, plate: v })); }}
            disabled={mode === "view"}
          />
          <TextField
            id="color"
            label="Color"
            value={form.color}
            onChange={(v) => { setForm((c) => ({ ...c, color: v })); }}
            disabled={mode === "view"}
          />
          <TextField
            id="model"
            label="Modelo"
            value={form.model}
            onChange={(v) => { setForm((c) => ({ ...c, model: v })); }}
            disabled={mode === "view"}
          />
          <TextField
            id="year"
            label="Año"
            value={form.year}
            onChange={(v) => { setForm((c) => ({ ...c, year: v })); }}
            disabled={mode === "view"}
            type="number"
          />
          <TextField
            id="seatedCapacity"
            label="Capacidad sentados"
            value={form.seatedCapacity}
            onChange={(v) => { setForm((c) => ({ ...c, seatedCapacity: v })); }}
            disabled={mode === "view"}
            type="number"
          />
          <TextField
            id="standingCapacity"
            label="Capacidad parados"
            value={form.standingCapacity}
            onChange={(v) => { setForm((c) => ({ ...c, standingCapacity: v })); }}
            disabled={mode === "view"}
            type="number"
          />
          <SelectField
            label="Estado"
            value={form.status}
            onChange={(v) => { setForm((c) => ({ ...c, status: v as BusStatus })); }}
            disabled={mode === "view"}
            options={statusOptions}
          />
        </>
      )}
    />
  );
}
