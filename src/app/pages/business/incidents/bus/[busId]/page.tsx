import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { DataTable } from "@/app/components/security/data-table";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";
import { useIncident } from "@/hooks/business";
import type { Incident, IncidentStatistics, IncidentType, IncidentStatus } from "@/core/domain/entities/business";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<Incident>();

const TYPE_OPTIONS: IncidentType[] = ["mechanical", "accident", "delay", "passenger", "other"];
const STATUS_OPTIONS: IncidentStatus[] = ["reported", "in_review", "closed"];

export default function IncidentsByBusPage() {
  const { busId = "" } = useParams();
  const navigate = useNavigate();
  const { incidents, busIncidents, loading, error, loadByBus } = useIncident();
  const [currentPage, setCurrentPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const reload = () =>
    loadByBus(busId, {
      page: currentPage + 1,
      limit: BUSINESS_PAGE_SIZE,
      type: typeFilter === "all" ? undefined : typeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    });

  useEffect(() => {
    if (!busId) return;
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busId, currentPage, typeFilter, statusFilter]);

  const stats = busIncidents?.statistics;
  const meta = busIncidents?.meta;

  const columns = [
    columnHelper.accessor("type", { header: "Tipo" }),
    columnHelper.accessor("severity", { header: "Severidad" }),
    columnHelper.accessor("status", { header: "Estado" }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <RowActionsDropdown
          actions={[
            {
              label: "Gestionar",
              icon: Eye,
              onClick: () => { void navigate(`/app/business/incidents/${info.row.original.id}`); },
            },
          ]}
        />
      ),
    }),
  ];

  return (
    <PageShell title="Incidentes por bus" description={`Bus: ${busId}`}>
      <IncidentStatsGrid stats={stats} />

      <IncidentFilters
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        setTypeFilter={setTypeFilter}
        setStatusFilter={setStatusFilter}
        onBack={() => { void navigate("/app/business/incidents"); }}
      />

      <DataTable
        title="Incidentes del bus"
        description="Filtrados por tipo y estado."
        data={incidents}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => void reload()}
        pageIndex={currentPage}
        pageSize={BUSINESS_PAGE_SIZE}
        pageCount={meta?.totalPages ?? 1}
        totalItems={meta?.totalItems}
        onPageChange={setCurrentPage}
        emptyMessage="Sin incidentes para este bus."
      />
    </PageShell>
  );
}

function IncidentStatsGrid({ stats }: { stats?: IncidentStatistics }) {
  if (!stats) return null;
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Total</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tasa resolución</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {(stats.resolutionRate * 100).toFixed(0)}%
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Por tipo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {Object.entries(stats.byType).map(([type, count]) => (
            <p key={type}>
              {type}: {count}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function IncidentFilters({
  typeFilter,
  statusFilter,
  setTypeFilter,
  setStatusFilter,
  onBack,
}: {
  typeFilter: string;
  statusFilter: string;
  setTypeFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          {TYPE_OPTIONS.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="outline" onClick={onBack}>
        Volver al listado
      </Button>
    </div>
  );
}
