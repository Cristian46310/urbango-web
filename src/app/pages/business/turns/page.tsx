import { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { SelectField, TextField } from "@/app/components/business/form-fields";
import { BUSINESS_LOOKUP_PAGE_SIZE } from "@/app/components/business/constants";
import { useBus, useDriverAdmin, useTurn } from "@/hooks/business";
import {
  TURN_STATUS_LABELS,
  TURN_STATUS_OPTIONS,
  type Turn,
  type TurnStatus,
} from "@/core/domain/entities/business";

interface TurnForm {
  id: string;
  busId: string;
  driverId: string;
  startTime: string;
  endTime: string;
  status: TurnStatus;
}

const initialForm: TurnForm = {
  id: "",
  busId: "",
  driverId: "",
  startTime: "",
  endTime: "",
  status: "scheduled",
};
const columnHelper = createColumnHelper<Turn>();

const STATUS_OPTIONS = TURN_STATUS_OPTIONS.map((value) => ({
  value,
  label: TURN_STATUS_LABELS[value],
}));

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isTurnStatus(value: string): value is TurnStatus {
  return (TURN_STATUS_OPTIONS as readonly string[]).includes(value);
}

function buildPayload(form: TurnForm) {
  return {
    busId: form.busId,
    driverId: form.driverId,
    startTime: new Date(form.startTime).toISOString(),
    endTime: new Date(form.endTime).toISOString(),
    status: form.status,
  };
}

export default function TurnsPage() {
  const crud = useTurn();
  const busCrud = useBus();
  const driverCrud = useDriverAdmin();
  const [busOptions, setBusOptions] = useState<{ value: string; label: string }[]>([]);
  const [driverOptions, setDriverOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    void busCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setBusOptions(p.items.map((b) => ({ value: b.id, label: b.plate })));
    });
    void driverCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setDriverOptions(p.items.map((d) => ({ value: d.id, label: d.name })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BusinessCrudPage
      title="Turnos"
      description="Turnos de conductores en buses."
      tableTitle="Listado de turnos"
      tableDescription="Turnos registrados."
      entityLabel="turno"
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
        busId: e.busId ?? "",
        driverId: e.driverId ?? "",
        startTime: toLocalDatetime(e.startTime),
        endTime: toLocalDatetime(e.endTime),
        status: isTurnStatus(e.status) ? e.status : "scheduled",
      })}
      getId={(f) => f.id}
      buildCreatePayload={buildPayload}
      buildUpdatePayload={buildPayload}
      columns={[
        columnHelper.accessor("status", {
          header: "Estado",
          cell: (i) => {
            const value = i.getValue();
            return isTurnStatus(value) ? TURN_STATUS_LABELS[value] : value;
          },
        }),
        columnHelper.accessor("startTime", {
          header: "Inicio",
          cell: (i) => new Date(String(i.getValue())).toLocaleString(),
        }),
        columnHelper.accessor("endTime", {
          header: "Fin",
          cell: (i) => new Date(String(i.getValue())).toLocaleString(),
        }),
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          <SelectField
            label="Bus"
            value={form.busId}
            onChange={(v) => { setForm((c) => ({ ...c, busId: v })); }}
            disabled={mode === "view"}
            options={busOptions}
          />
          <SelectField
            label="Conductor"
            value={form.driverId}
            onChange={(v) => { setForm((c) => ({ ...c, driverId: v })); }}
            disabled={mode === "view"}
            options={driverOptions}
          />
          <SelectField
            label="Estado"
            value={form.status}
            onChange={(v) => {
              if (isTurnStatus(v)) {
                setForm((c) => ({ ...c, status: v }));
              }
            }}
            disabled={mode === "view"}
            options={STATUS_OPTIONS}
          />
          <TextField
            id="startTime"
            label="Inicio"
            value={form.startTime}
            onChange={(v) => { setForm((c) => ({ ...c, startTime: v })); }}
            disabled={mode === "view"}
            type="datetime-local"
          />
          <TextField
            id="endTime"
            label="Fin"
            value={form.endTime}
            onChange={(v) => { setForm((c) => ({ ...c, endTime: v })); }}
            disabled={mode === "view"}
            type="datetime-local"
          />
        </>
      )}
    />
  );
}
