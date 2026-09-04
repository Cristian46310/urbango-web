import { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BusFront,
  CalendarClock,
  Clock,
  Eye,
  Pencil,
  Plus,
  Route as RouteIcon,
  Trash2,
} from "lucide-react";

import { BUSINESS_LOOKUP_PAGE_SIZE } from "@/app/components/business/constants";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";
import { DataTable } from "@/app/components/security/data-table";
import { PageShell } from "@/app/components/security/page-shell";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { RouteMap, type MapStop } from "@/app/components/transit/RouteMap";
import { useBus, useRoute, useScheduler } from "@/hooks/business";
import type { Scheduler, SchedulerStatus } from "@/core/domain/entities/business";
import { toTablePagination } from "@/infra/repository/business/businessPageAdapter";
import {
  getRouteById,
  orderedRouteStops,
} from "@/services/routePlanningService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showErrorToast } from "@/lib/toast";

const SCHEDULER_STATUS_OPTIONS: { value: SchedulerStatus; label: string }[] = [
  { value: "programado", label: "Programado" },
  { value: "en_curso", label: "En curso" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
];

interface SchedulerForm {
  id: string;
  busId: string;
  routeId: string;
  date: string;
  departureTime: string;
  status: SchedulerStatus;
}

const initialForm: SchedulerForm = {
  id: "",
  busId: "",
  routeId: "",
  date: "",
  departureTime: "",
  status: "programado",
};

const columnHelper = createColumnHelper<Scheduler>();

function toDateInput(value: string | undefined): string {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
}

function toTimeInput(value: string | undefined): string {
  if (!value) {
    return "";
  }
  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toServiceDate(date: string): string {
  return date.includes("T") ? date.slice(0, 10) : date;
}

function toDepartureTimePayload(time: string): string {
  const trimmed = time.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  return trimmed;
}

function formatSchedulerLabel(scheduler: Scheduler): string {
  const dateLabel = scheduler.date
    ? new Date(scheduler.date).toLocaleDateString("es-CO")
    : scheduler.startTime
      ? new Date(scheduler.startTime).toLocaleDateString("es-CO")
      : "—";
  const fallbackTime = toTimeInput(scheduler.startTime);
  const timeLabel =
    scheduler.departureTime ?? (fallbackTime.length > 0 ? fallbackTime : "—");
  return `${dateLabel} ${timeLabel}`;
}

function buildCreatePayload(form: SchedulerForm) {
  return {
    busId: form.busId,
    routeId: form.routeId,
    date: toServiceDate(form.date),
    departureTime: toDepartureTimePayload(form.departureTime),
  };
}

function buildUpdatePayload(form: SchedulerForm) {
  return {
    busId: form.busId,
    routeId: form.routeId,
    date: toServiceDate(form.date),
    departureTime: toDepartureTimePayload(form.departureTime),
    status: form.status,
  };
}

type PageMode = "list" | "create" | "edit" | "view";

export default function SchedulersPage() {
  const crud = useScheduler();
  const busCrud = useBus();
  const routeCrud = useRoute();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageMode, setPageMode] = useState<PageMode>("list");
  const [form, setForm] = useState<SchedulerForm>(initialForm);
  const [currentPage, setCurrentPage] = useState(0);
  const [busOptions, setBusOptions] = useState<{ value: string; label: string }[]>([]);
  const [routeOptions, setRouteOptions] = useState<{ value: string; label: string }[]>([]);
  const [routeStops, setRouteStops] = useState<MapStop[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [saving, setSaving] = useState(false);

  const pagination = toTablePagination(crud.page?.meta ?? null);

  useEffect(() => {
    void crud.loadItems(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    void busCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setBusOptions(p.items.map((b) => ({ value: b.id, label: b.plate })));
    });
    void routeCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setRouteOptions(p.items.map((r) => ({ value: r.id, label: r.name })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.get("mode") === "create") {
      setForm(initialForm);
      setPageMode("create");
    }
    // Deep-link de compatibilidad; solo se procesa al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pageMode === "list" || !form.routeId) {
      setRouteStops([]);
      return;
    }

    let cancelled = false;
    setLoadingRoute(true);
    void getRouteById(form.routeId)
      .then((detail) => {
        if (cancelled) return;
        setRouteStops(
          orderedRouteStops(detail).map((stop) => ({
            id: stop.id,
            name: stop.name,
            latitude: stop.latitude,
            longitude: stop.longitude,
            order: stop.order,
            location: stop.location,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setRouteStops([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRoute(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.routeId, pageMode]);

  const openList = () => {
    setPageMode("list");
    setForm(initialForm);
    setRouteStops([]);
    setSearchParams({}, { replace: true });
  };

  const openCreate = () => {
    setForm(initialForm);
    setPageMode("create");
    setSearchParams({ mode: "create" }, { replace: true });
  };

  const openScheduler = (mode: "edit" | "view", scheduler: Scheduler) => {
    setForm({
      id: scheduler.id,
      busId: scheduler.bus?.id ?? "",
      routeId: scheduler.route?.id ?? "",
      date: toDateInput(scheduler.date ?? scheduler.startTime),
      departureTime:
        scheduler.departureTime ?? toTimeInput(scheduler.startTime),
      status: scheduler.status ?? "programado",
    });
    setPageMode(mode);
    setSearchParams({ mode, id: scheduler.id }, { replace: true });
  };

  const handleSave = async () => {
    if (!form.busId || !form.routeId || !form.date || !form.departureTime) {
      showErrorToast("Completa bus, ruta, fecha y hora de salida.");
      return;
    }

    setSaving(true);
    try {
      if (pageMode === "create") {
        await crud.addItem(buildCreatePayload(form));
      } else if (pageMode === "edit" && form.id) {
        await crud.editItem(form.id, buildUpdatePayload(form));
      }
      openList();
      await crud.loadItems(currentPage);
    } catch {
      // El store presenta el error.
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await crud.removeItem(id);
    await crud.loadItems(currentPage);
  };

  const columns = [
    columnHelper.accessor("bus", {
      header: "Bus",
      cell: (i) => i.getValue()?.plate ?? "—",
    }),
    columnHelper.accessor("route", {
      header: "Ruta",
      cell: (i) => i.getValue()?.name ?? "—",
    }),
    columnHelper.display({
      id: "schedule",
      header: "Salida",
      cell: ({ row }) => formatSchedulerLabel(row.original),
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      cell: (i) =>
        SCHEDULER_STATUS_OPTIONS.find((option) => option.value === i.getValue())
          ?.label ?? i.getValue() ?? "programado",
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActionsDropdown
          actions={[
            {
              label: "Ver",
              icon: Eye,
              onClick: () => {
                openScheduler("view", row.original);
              },
            },
            {
              label: "Editar",
              icon: Pencil,
              onClick: () => {
                openScheduler("edit", row.original);
              },
            },
            {
              label: "Borrar",
              icon: Trash2,
              variant: "destructive",
              onClick: () => {
                void handleDelete(row.original.id);
              },
            },
          ]}
        />
      ),
    }),
  ];

  const readOnly = pageMode === "view";
  const selectedBus =
    busOptions.find((option) => option.value === form.busId)?.label ??
    "Sin seleccionar";
  const selectedRoute =
    routeOptions.find((option) => option.value === form.routeId)?.label ??
    "Sin seleccionar";
  const editorTitle =
    pageMode === "create"
      ? "Crear programación"
      : pageMode === "edit"
        ? "Editar programación"
        : "Detalle de programación";

  return (
    <PageShell
      title="Programación"
      description="Asigna buses y horarios a las rutas desde una sola vista."
    >
      {pageMode === "list" ? (
        <DataTable
          title="Listado de programaciones"
          description="Consulta, crea y administra las salidas programadas."
          data={crud.items}
          columns={columns}
          loading={crud.loading}
          error={crud.error}
          onRefresh={() => {
            void crud.loadItems(currentPage);
          }}
          pageIndex={currentPage}
          pageSize={BUSINESS_PAGE_SIZE}
          pageCount={pagination.pageCount}
          totalItems={pagination.totalItems}
          onPageChange={setCurrentPage}
          emptyMessage="No hay programaciones registradas."
          toolbarAction={
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-1 size-4" />
              Nueva programación
            </Button>
          }
        />
      ) : (
        <div className="mx-auto w-full max-w-6xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {editorTitle}
              </h2>
              <p className="text-sm text-muted-foreground">
                Asigna un bus, una ruta y la hora de salida.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={openList}>
              <ArrowLeft className="size-4" />
              Volver al listado
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-(--security-border) lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Datos de la programación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Bus</Label>
                  <Select
                    value={form.busId}
                    onValueChange={(value) => {
                      setForm((current) => ({ ...current, busId: value }));
                    }}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Selecciona un bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {busOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ruta</Label>
                  <Select
                    value={form.routeId}
                    onValueChange={(value) => {
                      setForm((current) => ({ ...current, routeId: value }));
                    }}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Selecciona una ruta" />
                    </SelectTrigger>
                    <SelectContent>
                      {routeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scheduler-date">Fecha</Label>
                    <Input
                      id="scheduler-date"
                      type="date"
                      className="h-11"
                      value={form.date}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          date: event.target.value,
                        }));
                      }}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduler-time">Hora de salida</Label>
                    <Input
                      id="scheduler-time"
                      type="time"
                      className="h-11"
                      value={form.departureTime}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          departureTime: event.target.value,
                        }));
                      }}
                      disabled={readOnly}
                    />
                  </div>
                </div>

                {pageMode === "create" ? (
                  <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                    El estado se asigna automáticamente como <strong>programado</strong> al crear.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => {
                        setForm((current) => ({
                          ...current,
                          status: value as SchedulerStatus,
                        }));
                      }}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULER_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!readOnly ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      className="h-11 bg-teal-700 px-6 text-white hover:bg-teal-600"
                      disabled={saving}
                      onClick={() => {
                        void handleSave();
                      }}
                    >
                      {saving
                        ? "Guardando..."
                        : pageMode === "create"
                          ? "Guardar programación"
                          : "Actualizar programación"}
                    </Button>
                    <Button type="button" variant="outline" onClick={openList}>
                      Cancelar
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-(--security-border) lg:col-span-1 lg:self-start">
              <CardHeader>
                <CardTitle className="text-lg">Resumen de salida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <BusFront className="mt-0.5 size-4 shrink-0 text-teal-700" />
                    <div>
                      <p className="text-xs text-muted-foreground">Bus</p>
                      <p className="font-medium">{selectedBus}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RouteIcon className="mt-0.5 size-4 shrink-0 text-teal-700" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ruta</p>
                      <p className="font-medium">{selectedRoute}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-teal-700" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha</p>
                      <p className="font-medium">{form.date || "Sin seleccionar"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 size-4 shrink-0 text-teal-700" />
                    <div>
                      <p className="text-xs text-muted-foreground">Hora de salida</p>
                      <p className="font-medium">
                        {form.departureTime || "Sin seleccionar"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="mb-2 text-sm font-medium">Recorrido seleccionado</p>
                  {loadingRoute ? (
                    <div className="flex h-80 items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
                      Cargando recorrido...
                    </div>
                  ) : (
                    <RouteMap
                      key={form.routeId || "empty-route"}
                      stops={routeStops}
                      heightClassName="h-80"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
