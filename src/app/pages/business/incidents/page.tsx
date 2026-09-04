import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import {
  AlertTriangle,
  Camera,
  Eye,
  RefreshCw,
} from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { DataTable } from "@/app/components/security/data-table";
import {
  BUSINESS_LOOKUP_PAGE_SIZE,
} from "@/app/components/business/constants";
import { SearchableSelectField } from "@/app/components/business/form-fields";
import { DialogField } from "@/app/components/security/dialog-field";
import { useBus, useIncident } from "@/hooks/business";
import type { Incident, IncidentSeverity } from "@/core/domain/entities/business";
import {
  formatIncidentDate,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_SEVERITY_RANK,
  incidentSeverityLabel,
  incidentStatusLabel,
  incidentTypeLabel,
  truncateText,
} from "@/core/domain/entities/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { showErrorToast } from "@/lib/toast";

const PAGE_SIZE = 15;
const FETCH_LIMIT = BUSINESS_LOOKUP_PAGE_SIZE;

type SortMode = "newest" | "oldest" | "severity";

const columnHelper = createColumnHelper<Incident>();

const SEVERITY_BADGE: Record<IncidentSeverity, string> = {
  low: "border-slate-300 bg-slate-100 text-slate-700",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  high: "border-orange-300 bg-orange-50 text-orange-900",
  critical: "border-red-300 bg-red-50 text-red-800",
};

const STATUS_BADGE: Record<string, string> = {
  reported: "border-blue-200 bg-blue-50 text-blue-800",
  in_review: "border-amber-300 bg-amber-50 text-amber-900",
  closed: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function startOfDayIso(dateStr: string): string | null {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function endOfDayIso(dateStr: string): string | null {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function busPlate(incident: Incident): string {
  return incident.bus?.plate?.trim() || "—";
}

export default function IncidentsPage() {
  const navigate = useNavigate();
  const { incidents, loading, error, loadIncidents } = useIncident();
  const busCrud = useBus();

  const [busOptions, setBusOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedSeverities, setSelectedSeverities] = useState<IncidentSeverity[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [currentPage, setCurrentPage] = useState(0);

  const reload = () => loadIncidents(0, FETCH_LIMIT);

  useEffect(() => {
    void reload().catch(() => undefined);
    void busCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((page) => {
      setBusOptions(
        page.items.map((bus) => ({
          value: bus.id,
          label: bus.plate + (bus.model ? ` — ${bus.model}` : ""),
        })),
      );
    }).catch(() => {
      showErrorToast("No se pudieron cargar los buses para el filtro");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedBusId, searchText, selectedSeverities, dateFrom, dateTo, sortMode]);

  const toggleSeverity = (severity: IncidentSeverity) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((item) => item !== severity)
        : [...prev, severity],
    );
  };

  const filteredSorted = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("es");
    const fromIso = startOfDayIso(dateFrom);
    const toIso = endOfDayIso(dateTo);

    let list = incidents.filter((incident) => {
      if (selectedBusId) {
        const matchesBus =
          incident.busId === selectedBusId || incident.bus?.id === selectedBusId;
        if (!matchesBus) return false;
      }

      if (query) {
        const haystack = [
          incident.description,
          incidentTypeLabel(incident.type),
          incident.type,
        ]
          .join(" ")
          .toLocaleLowerCase("es");
        if (!haystack.includes(query)) return false;
      }

      if (selectedSeverities.length > 0 && !selectedSeverities.includes(incident.severity)) {
        return false;
      }

      const reportedAt = incident.reportedAt || incident.createdAt;
      if (fromIso && reportedAt && reportedAt < fromIso) return false;
      if (toIso && reportedAt && reportedAt > toIso) return false;

      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortMode === "severity") {
        return (
          (INCIDENT_SEVERITY_RANK[b.severity] ?? 0) -
          (INCIDENT_SEVERITY_RANK[a.severity] ?? 0)
        );
      }
      const aTime = new Date(a.reportedAt || a.createdAt).getTime();
      const bTime = new Date(b.reportedAt || b.createdAt).getTime();
      return sortMode === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [
    incidents,
    selectedBusId,
    searchText,
    selectedSeverities,
    dateFrom,
    dateTo,
    sortMode,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredSorted.slice(start, start + PAGE_SIZE);
  }, [filteredSorted, currentPage]);

  const columns = [
    columnHelper.accessor((row) => row.reportedAt || row.createdAt, {
      id: "reportedAt",
      header: "Fecha/hora",
      cell: (i) => formatIncidentDate(i.getValue()),
    }),
    columnHelper.accessor((row) => busPlate(row), {
      id: "bus",
      header: "Bus",
      cell: (i) => i.getValue(),
    }),
    columnHelper.accessor((row) => row.driver?.name ?? "—", {
      id: "driver",
      header: "Conductor",
    }),
    columnHelper.accessor("type", {
      header: "Tipo",
      cell: (i) => incidentTypeLabel(i.getValue()),
    }),
    columnHelper.accessor("severity", {
      header: "Gravedad",
      cell: (i) => {
        const severity = i.getValue();
        return (
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
              SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.medium,
            )}
          >
            {incidentSeverityLabel(severity)}
          </span>
        );
      },
    }),
    columnHelper.accessor("description", {
      header: "Descripción",
      cell: (i) => {
        const full = i.getValue() || "";
        const short = truncateText(full, 60);
        if (!full || full === short) {
          return <span className="text-sm">{short || "—"}</span>;
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="max-w-[240px] text-left text-sm underline-offset-2 hover:underline">
                {short}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm text-sm">{full}</TooltipContent>
          </Tooltip>
        );
      },
    }),
    columnHelper.display({
      id: "photos",
      header: "Fotos",
      cell: ({ row }) => {
        const count = row.original.photos?.length ?? 0;
        if (count === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="inline-flex items-center gap-1 text-sm tabular-nums">
            <Camera className="size-3.5" aria-hidden />
            {count}
          </span>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      cell: (i) => {
        const status = i.getValue();
        return (
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
              STATUS_BADGE[status] ?? STATUS_BADGE.reported,
            )}
          >
            {incidentStatusLabel(status)}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void navigate(`/app/business/incidents/${row.original.id}`);
          }}
        >
          <Eye className="size-3.5" />
          Ver detalle
        </Button>
      ),
    }),
  ];

  const clearFilters = () => {
    setSelectedBusId("");
    setSearchText("");
    setSelectedSeverities([]);
    setDateFrom("");
    setDateTo("");
    setSortMode("newest");
  };

  return (
    <PageShell
      title="Incidentes"
      description="Supervisión de reportes de incidentes."
    >
      <TooltipProvider delayDuration={200}>
        <div className="mb-4 rounded-2xl border border-(--security-border) bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Filtros</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { void reload(); }}
                disabled={loading}
              >
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
                Refrescar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <SearchableSelectField
                label="Bus"
                value={selectedBusId}
                onChange={setSelectedBusId}
                options={busOptions}
                forceSearchable
                allowClear
                placeholder="Buscar por placa..."
                searchPlaceholder="Escribe la placa..."
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!selectedBusId}
                onClick={() => {
                  void navigate(`/app/business/incidents/bus/${selectedBusId}`);
                }}
              >
                Ver por bus
              </Button>
            </div>

            <DialogField label="Buscar" htmlFor="incident-search">
              <Input
                id="incident-search"
                value={searchText}
                onChange={(event) => { setSearchText(event.target.value); }}
                placeholder="Descripción o tipo de incidente"
                className="h-11"
              />
            </DialogField>

            <div className="space-y-2">
              <Label>Gravedad</Label>
              <div className="flex flex-wrap gap-2">
                {INCIDENT_SEVERITY_OPTIONS.map((severity) => {
                  const selected = selectedSeverities.includes(severity);
                  return (
                    <button
                      key={severity}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => { toggleSeverity(severity); }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selected
                          ? SEVERITY_BADGE[severity]
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {INCIDENT_SEVERITY_LABELS[severity]}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogField label="Desde" htmlFor="incident-from">
              <Input
                id="incident-from"
                type="date"
                value={dateFrom}
                onChange={(event) => { setDateFrom(event.target.value); }}
                className="h-11"
              />
            </DialogField>

            <DialogField label="Hasta" htmlFor="incident-to">
              <Input
                id="incident-to"
                type="date"
                value={dateTo}
                onChange={(event) => { setDateTo(event.target.value); }}
                className="h-11"
              />
            </DialogField>

            <div className="space-y-2">
              <Label htmlFor="incident-sort">Orden</Label>
              <Select
                value={sortMode}
                onValueChange={(value) => { setSortMode(value as SortMode); }}
              >
                <SelectTrigger id="incident-sort" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más reciente</SelectItem>
                  <SelectItem value="oldest">Más antiguo</SelectItem>
                  <SelectItem value="severity">Mayor gravedad primero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DataTable
          title="Todos los incidentes"
          description={`${filteredSorted.length} incidente(s) con los filtros aplicados.`}
          data={pageItems}
          columns={columns}
          loading={loading}
          error={error}
          showRefresh={false}
          pageIndex={currentPage}
          pageSize={PAGE_SIZE}
          pageCount={pageCount}
          totalItems={filteredSorted.length}
          onPageChange={setCurrentPage}
          emptyMessage="No hay incidentes"
          emptyIcon={
            <AlertTriangle
              className="size-11 text-amber-400"
              strokeWidth={1.5}
              aria-hidden
            />
          }
        />
      </TooltipProvider>
    </PageShell>
  );
}
