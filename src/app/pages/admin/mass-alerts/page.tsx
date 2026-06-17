import { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart3 } from "lucide-react";

import { MassAlertForm } from "@/app/components/alerts/MassAlertForm";
import { MassAlertStatsDialog } from "@/app/components/alerts/MassAlertStatsDialog";
import { PageShell } from "@/app/components/security/page-shell";
import { DataTable } from "@/app/components/security/data-table";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import type { MassAlert, MassAlertStats } from "@/core/types/alerts";
import { useMassAlerts } from "@/hooks/alerts/useMassAlerts";
import { getRoutes, type RouteListItem } from "@/services/routeService";

const columnHelper = createColumnHelper<MassAlert>();

const scopeLabels: Record<MassAlert["scope"], string> = {
  all: "Todos",
  route: "Ruta",
  zone: "Zona",
};

const statusLabels: Record<MassAlert["status"], string> = {
  sent: "Enviada",
  scheduled: "Programada",
};

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy HH:mm", { locale: es });
  } catch {
    return value;
  }
}

export default function MassAlertsAdminPage() {
  const {
    alerts,
    loading,
    previewLoading,
    sending,
    previewCount,
    page,
    totalPages,
    totalItems,
    setPage,
    loadMassAlerts,
    previewRecipients,
    sendMassAlert,
    fetchStats,
    clearPreview,
  } = useMassAlerts();

  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<MassAlertStats | null>(null);
  const [statsTitle, setStatsTitle] = useState<string>();

  useEffect(() => {
    void getRoutes()
      .then((data) => { setRoutes(data); })
      .finally(() => { setRoutesLoading(false); });
  }, []);

  const handleShowStats = async (alert: MassAlert) => {
    setStatsOpen(true);
    setStatsLoading(true);
    setStats(null);
    setStatsTitle(alert.title);
    const result = await fetchStats(alert.id);
    setStats(result);
    setStatsLoading(false);
  };

  const columns = [
    columnHelper.accessor("title", {
      header: "Título",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("scope", {
      header: "Alcance",
      cell: (info) => scopeLabels[info.getValue()],
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      cell: (info) => statusLabels[info.getValue()],
    }),
    columnHelper.accessor("recipientCount", {
      header: "Destinatarios",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("isUrgent", {
      header: "Urgente",
      cell: (info) => (info.getValue() ? "Sí" : "No"),
    }),
    columnHelper.accessor("sentAt", {
      header: "Enviada",
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const alert = info.row.original;
        return (
          <RowActionsDropdown
            actions={
              alert.status === "sent"
                ? [
                    {
                      label: "Ver estadísticas",
                      icon: BarChart3,
                      onClick: () => { void handleShowStats(alert); },
                    },
                  ]
                : []
            }
          />
        );
      },
    }),
  ];

  return (
    <PageShell
      title="Alertas masivas"
      description="Envía comunicaciones unidireccionales a todos los usuarios, por ruta o por zona."
    >
      <MassAlertForm
        routes={routes}
        routesLoading={routesLoading}
        previewLoading={previewLoading}
        sending={sending}
        previewCount={previewCount}
        onPreview={previewRecipients}
        onSend={sendMassAlert}
        onClearPreview={clearPreview}
      />

      <DataTable
        title="Historial de alertas"
        description="Alertas enviadas y programadas."
        data={alerts}
        columns={columns}
        loading={loading}
        onRefresh={() => { void loadMassAlerts(page); }}
        pageIndex={page - 1}
        pageSize={10}
        pageCount={totalPages}
        totalItems={totalItems}
        onPageChange={(nextPage) => {
          setPage(nextPage + 1);
          void loadMassAlerts(nextPage + 1);
        }}
        emptyMessage="Aún no has enviado alertas masivas."
      />

      <MassAlertStatsDialog
        open={statsOpen}
        loading={statsLoading}
        stats={stats}
        alertTitle={statsTitle}
        onOpenChange={setStatsOpen}
      />
    </PageShell>
  );
}
