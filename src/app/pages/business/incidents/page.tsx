import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { DataTable } from "@/app/components/security/data-table";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";
import { toTablePagination } from "@/infra/repository/business/businessPageAdapter";
import { useIncident } from "@/hooks/business";
import type { Incident } from "@/core/domain/entities/business";
import {
  formatIncidentDate,
  incidentSeverityLabel,
  incidentStatusLabel,
  incidentTypeLabel,
} from "@/core/domain/entities/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogField } from "@/app/components/security/dialog-field";

const columnHelper = createColumnHelper<Incident>();

export default function IncidentsPage() {
  const navigate = useNavigate();
  const { incidents, incidentsPage, loading, error, loadIncidents } = useIncident();
  const [currentPage, setCurrentPage] = useState(0);
  const [busIdFilter, setBusIdFilter] = useState("");

  const pagination = toTablePagination(incidentsPage?.meta ?? null);

  useEffect(() => {
    void loadIncidents(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const columns = [
    columnHelper.accessor("type", {
      header: "Tipo",
      cell: (i) => incidentTypeLabel(i.getValue()),
    }),
    columnHelper.accessor("severity", {
      header: "Severidad",
      cell: (i) => incidentSeverityLabel(i.getValue()),
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      cell: (i) => incidentStatusLabel(i.getValue()),
    }),
    columnHelper.accessor("reportedAt", {
      header: "Reportado",
      cell: (i) => formatIncidentDate(i.getValue()),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const incident = info.row.original;
        return (
          <RowActionsDropdown
            actions={[
              {
                label: "Gestionar",
                icon: Eye,
                onClick: () => { void navigate(`/app/business/incidents/${incident.id}`); },
              },
            ]}
          />
        );
      },
    }),
  ];

  return (
    <PageShell
      title="Incidentes"
      description="Supervisión de reportes de incidentes."
    >
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <DialogField label="Filtrar por bus (UUID)" htmlFor="busId">
          <Input
            id="busId"
            value={busIdFilter}
            onChange={(e) => { setBusIdFilter(e.target.value); }}
            placeholder="ID del bus"
            className="min-w-[280px]"
          />
        </DialogField>
        <Button
          type="button"
          variant="outline"
          disabled={!busIdFilter.trim()}
          onClick={() => { void navigate(`/app/business/incidents/bus/${busIdFilter.trim()}`); }}
        >
          Ver por bus
        </Button>
      </div>

      <DataTable
        title="Todos los incidentes"
        description="Listado general de incidentes reportados."
        data={incidents}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => void loadIncidents(currentPage)}
        pageIndex={currentPage}
        pageSize={BUSINESS_PAGE_SIZE}
        pageCount={pagination.pageCount}
        totalItems={pagination.totalItems}
        onPageChange={setCurrentPage}
        filterField="description"
        emptyMessage="No hay incidentes."
      />
    </PageShell>
  );
}
