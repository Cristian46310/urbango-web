import { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import {
  SearchableSelectField,
  TextField,
} from "@/app/components/business/form-fields";
import { DialogField } from "@/app/components/security/dialog-field";
import { BUSINESS_LOOKUP_PAGE_SIZE } from "@/app/components/business/constants";
import { useBus, useDriverAdmin, useTurn } from "@/hooks/business";
import { cn } from "@/lib/utils";
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
  busLabel: string;
  driverLabel: string;
  startTime: string;
  endTime: string;
  status: TurnStatus;
}

const initialForm: TurnForm = {
  id: "",
  busId: "",
  driverId: "",
  busLabel: "",
  driverLabel: "",
  startTime: "",
  endTime: "",
  status: "scheduled",
};
const columnHelper = createColumnHelper<Turn>();

const STATUS_OPTIONS = TURN_STATUS_OPTIONS.map((value) => ({
  value,
  label: TURN_STATUS_LABELS[value],
}));

const STATUS_CHIP_CLASSES: Record<TurnStatus, string> = {
  scheduled:
    "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 data-[selected=true]:border-blue-600 data-[selected=true]:bg-blue-200 data-[selected=true]:ring-2 data-[selected=true]:ring-blue-400/40",
  in_progress:
    "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 data-[selected=true]:border-emerald-600 data-[selected=true]:bg-emerald-200 data-[selected=true]:ring-2 data-[selected=true]:ring-emerald-400/40",
  completed:
    "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 data-[selected=true]:border-slate-600 data-[selected=true]:bg-slate-200 data-[selected=true]:ring-2 data-[selected=true]:ring-slate-400/40",
  cancelled:
    "border-red-300 bg-red-50 text-red-800 hover:bg-red-100 data-[selected=true]:border-red-600 data-[selected=true]:bg-red-200 data-[selected=true]:ring-2 data-[selected=true]:ring-red-400/40",
};

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
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

function ensureOption(
  options: { value: string; label: string }[],
  id: string,
  label?: string,
) {
  if (!id) return options;
  if (options.some((option) => option.value === id)) return options;
  return [...options, { value: id, label: label?.trim() || id }];
}

function resolveOptionLabel(
  options: { value: string; label: string }[],
  id: string,
  fallback?: string,
) {
  if (!id) return "—";
  return options.find((option) => option.value === id)?.label || fallback || id;
}

export default function TurnsPage() {
  const crud = useTurn();
  const busCrud = useBus();
  const driverCrud = useDriverAdmin();
  const [busOptions, setBusOptions] = useState<{ value: string; label: string }[]>([]);
  const [driverOptions, setDriverOptions] = useState<{ value: string; label: string }[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    void busCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setBusOptions(p.items.map((b) => ({ value: String(b.id), label: b.plate })));
    });
    void driverCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setDriverOptions(p.items.map((d) => ({ value: String(d.id), label: d.name })));
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
      saveLabel="Guardar cambios"
      items={crud.items}
      page={crud.page}
      loading={crud.loading}
      error={crud.error}
      loadItems={crud.loadItems}
      addItem={crud.addItem}
      editItem={crud.editItem}
      removeItem={crud.removeItem}
      initialForm={initialForm}
      mapToForm={(e) => {
        const busId = String(e.busId ?? e.bus?.id ?? "");
        const driverId = String(e.driverId ?? e.driver?.id ?? "");
        return {
          id: e.id,
          busId,
          driverId,
          busLabel: e.bus?.plate ?? "",
          driverLabel: e.driver?.name ?? "",
          startTime: toLocalDatetime(e.startTime),
          endTime: toLocalDatetime(e.endTime),
          status: isTurnStatus(e.status) ? e.status : "scheduled",
        };
      }}
      getId={(f) => f.id}
      buildCreatePayload={buildPayload}
      buildUpdatePayload={buildPayload}
      validateForm={(form) => {
        if (!form.startTime || !form.endTime) {
          setDateError("Selecciona la fecha y hora de inicio y fin");
          return false;
        }
        const start = new Date(form.startTime).getTime();
        const end = new Date(form.endTime).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
          setDateError("La hora de fin debe ser posterior al inicio");
          return false;
        }
        setDateError(null);
        return true;
      }}
      isFormDirty={(form, baseline) =>
        JSON.stringify(form) !== JSON.stringify(baseline)
      }
      onDialogOpen={() => {
        setDateError(null);
      }}
      columns={[
        columnHelper.accessor("bus", {
          header: "Bus",
          cell: (i) => i.getValue()?.plate ?? "—",
        }),
        columnHelper.accessor("driver", {
          header: "Conductor",
          cell: (i) => i.getValue()?.name ?? "—",
        }),
        columnHelper.accessor("status", {
          header: "Estado",
          cell: (i) => {
            const value: unknown = i.getValue();
            if (typeof value !== "string") return "—";
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
      renderForm={(form, setForm, mode) => {
        const mergedBusOptions = ensureOption(busOptions, form.busId, form.busLabel);
        const mergedDriverOptions = ensureOption(
          driverOptions,
          form.driverId,
          form.driverLabel,
        );

        if (mode === "view") {
          return (
            <>
              <DialogField label="Bus">
                <p className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
                  {resolveOptionLabel(mergedBusOptions, form.busId, form.busLabel)}
                </p>
              </DialogField>
              <DialogField label="Conductor">
                <p className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
                  {resolveOptionLabel(
                    mergedDriverOptions,
                    form.driverId,
                    form.driverLabel,
                  )}
                </p>
              </DialogField>
              <DialogField label="Estado">
                <div
                  className="grid grid-cols-2 gap-2"
                  role="radiogroup"
                  aria-label="Estado del turno"
                >
                  {STATUS_OPTIONS.map((option) => {
                    const selected = form.status === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        data-selected={selected}
                        disabled
                        className={cn(
                          "h-11 rounded-lg border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                          STATUS_CHIP_CLASSES[option.value],
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </DialogField>
              <TextField
                id="startTime"
                label="Inicio"
                value={form.startTime}
                onChange={() => undefined}
                disabled
                type="datetime-local"
                className="w-full"
              />
              <TextField
                id="endTime"
                label="Fin"
                value={form.endTime}
                onChange={() => undefined}
                disabled
                type="datetime-local"
                className="w-full"
              />
            </>
          );
        }

        return (
          <>
            <SearchableSelectField
              label="Bus"
              value={form.busId}
              onChange={(v) => {
                setForm((c) => ({
                  ...c,
                  busId: v,
                  busLabel:
                    mergedBusOptions.find((option) => option.value === v)?.label ?? "",
                }));
              }}
              placeholder="Seleccionar bus"
              searchPlaceholder="Buscar por placa..."
              options={mergedBusOptions}
            />
            <SearchableSelectField
              label="Conductor"
              value={form.driverId}
              onChange={(v) => {
                setForm((c) => ({
                  ...c,
                  driverId: v,
                  driverLabel:
                    mergedDriverOptions.find((option) => option.value === v)?.label ??
                    "",
                }));
              }}
              placeholder="Seleccionar conductor"
              searchPlaceholder="Buscar conductor..."
              options={mergedDriverOptions}
            />
            <DialogField label="Estado">
              <div
                className="grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label="Estado del turno"
              >
                {STATUS_OPTIONS.map((option) => {
                  const selected = form.status === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-selected={selected}
                      className={cn(
                        "h-11 rounded-lg border px-2 text-sm font-medium transition-colors",
                        STATUS_CHIP_CLASSES[option.value],
                      )}
                      onClick={() => {
                        setForm((current) => ({
                          ...current,
                          status: option.value,
                        }));
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </DialogField>
            <TextField
              id="startTime"
              label="Inicio"
              value={form.startTime}
              onChange={(v) => {
                setDateError(null);
                setForm((c) => ({ ...c, startTime: v }));
              }}
              type="datetime-local"
              className="w-full"
            />
            <TextField
              id="endTime"
              label="Fin"
              value={form.endTime}
              onChange={(v) => {
                setDateError(null);
                setForm((c) => ({ ...c, endTime: v }));
              }}
              type="datetime-local"
              className="w-full"
              error={dateError}
            />
          </>
        );
      }}
    />
  );
}
