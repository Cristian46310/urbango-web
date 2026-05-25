import { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { SelectField, TextField } from "@/app/components/business/form-fields";
import { BUSINESS_LOOKUP_PAGE_SIZE } from "@/app/components/business/constants";
import { useBus, useRoute, useScheduler } from "@/hooks/business";
import type { Bus, Route, Scheduler } from "@/core/domain/entities/business";

interface SchedulerForm {
  id: string;
  busId: string;
  routeId: string;
  startTime: string;
  endTime: string;
  recurrence: "none" | "daily" | "weekday" | "weekend";
  toleranceMinutes: number;
  status: string;
}

const initialForm: SchedulerForm = {
  id: "",
  busId: "",
  routeId: "",
  startTime: "",
  endTime: "",
  recurrence: "none",
  toleranceMinutes: 5,
  status: "programado",
};

const columnHelper = createColumnHelper<Scheduler>();

const RECURRENCE_OPTIONS = [
  { value: "none", label: "No recurrente" },
  { value: "daily", label: "Diaria" },
  { value: "weekday", label: "Lunes a Viernes" },
  { value: "weekend", label: "Fines de semana" },
];

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildPayload(form: SchedulerForm) {
  return {
    busId: form.busId,
    routeId: form.routeId,
    startTime: new Date(form.startTime).toISOString(),
    endTime: new Date(form.endTime).toISOString(),
    recurrence: form.recurrence,
    toleranceMinutes: Number(form.toleranceMinutes),
    status: form.status || "programado",
  };
}

export default function SchedulersPage() {
  const crud = useScheduler();
  const busCrud = useBus();
  const routeCrud = useRoute();
  const [busOptions, setBusOptions] = useState<{ value: string; label: string }[]>([]);
  const [routeOptions, setRouteOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    void busCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setBusOptions(p.items.map((b) => ({ value: b.id, label: b.plate })));
    });
    void routeCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setRouteOptions(p.items.map((r) => ({ value: r.id, label: r.name })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BusinessCrudPage
      title="Programacion"
      description="Horarios de buses en rutas."
      tableTitle="Listado de programaciones"
      tableDescription="Schedulers activos."
      entityLabel="programacion"
      items={crud.items}
      page={crud.page}
      loading={crud.loading}
      error={crud.error}
      loadItems={crud.loadItems}
      addItem={crud.addItem}
      editItem={crud.editItem}
      removeItem={crud.removeItem}
      initialForm={initialForm}
      mapToForm={(e: any) => ({
        id: e.id,
        busId: e.bus?.id ?? "",
        routeId: e.route?.id ?? "",
        startTime: toLocalDatetime(e.startTime),
        endTime: toLocalDatetime(e.endTime),
        recurrence: e.recurrence ?? "none",
        toleranceMinutes: e.toleranceMinutes ?? 5,
        status: e.status ?? "programado",
      })}
      getId={(f) => f.id}
      buildCreatePayload={buildPayload}
      buildUpdatePayload={buildPayload}
      columns={[
        columnHelper.accessor("bus", {
          header: "Bus",
          cell: (i) => (i.getValue() as Bus | undefined)?.plate ?? "—",
        }),
        columnHelper.accessor("route", {
          header: "Ruta",
          cell: (i) => (i.getValue() as Route | undefined)?.name ?? "—",
        }),
        columnHelper.accessor("startTime", {
          header: "Inicio",
          cell: (i) => new Date(String(i.getValue())).toLocaleString(),
        }),
        columnHelper.accessor("status", {
          header: "Estado",
          cell: (i) => String(i.getValue() ?? "programado"),
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
            label="Ruta"
            value={form.routeId}
            onChange={(v) => { setForm((c) => ({ ...c, routeId: v })); }}
            disabled={mode === "view"}
            options={routeOptions}
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
          <SelectField
            label="Recurrencia"
            value={form.recurrence}
            onChange={(v) => { setForm((c) => ({ ...c, recurrence: v as any })); }}
            disabled={mode === "view"}
            options={RECURRENCE_OPTIONS}
          />
          <TextField
            id="toleranceMinutes"
            label="Margen de tolerancia (Minutos)"
            value={String(form.toleranceMinutes)}
            onChange={(v) => { setForm((c) => ({ ...c, toleranceMinutes: Number(v) })); }}
            disabled={mode === "view"}
            type="number"
          />
        </>
      )}
    />
  );
}