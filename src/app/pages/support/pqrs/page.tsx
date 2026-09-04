import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileQuestion, Search } from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { DataTable } from "@/app/components/security/data-table";
import { PqrsForm } from "@/app/components/support/PqrsForm";
import {
  PqrsStatusBadge,
  typeLabels,
  categoryLabels,
  statusLabels,
} from "@/app/components/support/PqrsStatusBadge";
import { PqrsDetailDialog } from "@/app/components/support/PqrsDetailDialog";
import type { Pqrs, PqrsCategory, PqrsStatus } from "@/core/types/pqrs";
import { usePqrs } from "@/hooks/pqrs/usePqrs";
import { usePqrsAdmin } from "@/hooks/pqrs/usePqrsAdmin";
import { useAuthStore } from "@/store/security/authStore";
import { ROLE_GROUPS } from "@/core/domain/entities/security/Roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDate(value: string) {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: es });
  } catch {
    return value;
  }
}

const columnHelper = createColumnHelper<Pqrs>();

export default function SupportPqrsPage() {
  const { currentUser, hasAnyRole } = useAuthStore();
  const isAdmin = hasAnyRole(ROLE_GROUPS.ADMIN_ROLES);

  const citizenHook = usePqrs(currentUser?.email ?? null);
  const adminHook = usePqrsAdmin();

  const [detailPqrs, setDetailPqrs] = useState<Pqrs | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [ticketInput, setTicketInput] = useState("");

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleOpenDetail = async (pqrs: Pqrs) => {
    // Preferir detalle fresco por id (incluye imágenes)
    const full = await citizenHook.loadById(pqrs.id);
    setDetailPqrs(full ?? pqrs);
    setDetailOpen(true);
  };

  const handleApplyFilters = () => {
    adminHook.applyFilters({
      status: filterStatus !== "all" ? (filterStatus as PqrsStatus) : undefined,
      category:
        filterCategory !== "all" ? (filterCategory as PqrsCategory) : undefined,
    });
  };

  const columns = [
    columnHelper.accessor("ticket_number", {
      header: "Ticket",
      cell: (info) => (
        <span className="font-mono text-xs font-semibold">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("user_email", {
      header: "Usuario",
      cell: (info) => <span className="text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor("type", {
      header: "Tipo",
      cell: (info) => typeLabels[info.getValue()] ?? info.getValue(),
    }),
    columnHelper.accessor("category", {
      header: "Categoría",
      cell: (info) => {
        const value = info.getValue();
        return value ? (categoryLabels[value] ?? value) : "—";
      },
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      cell: (info) => <PqrsStatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("created_at", {
      header: "Fecha",
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.display({
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void handleOpenDetail(row.original);
            }}
          >
            Ver / Seguimiento
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => {
              void adminHook.remove(row.original.id);
            }}
          >
            Eliminar
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      title="PQRS"
      description="Peticiones, quejas, reclamos y sugerencias."
    >
      {isAdmin ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Estado</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.entries(statusLabels) as [PqrsStatus, string][]).map(
                    ([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Categoría</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {(
                    Object.entries(categoryLabels) as [PqrsCategory, string][]
                  ).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" size="sm" onClick={handleApplyFilters}>
              Aplicar filtros
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setFilterStatus("all");
                setFilterCategory("all");
                adminHook.applyFilters({});
              }}
            >
              Limpiar
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={adminHook.pqrsList}
            title="Todas las PQRS"
            description="Gestión y seguimiento de PQRS del sistema."
            loading={adminHook.loading}
            onRefresh={() => {
              void adminHook.load();
            }}
            emptyMessage="No hay PQRS que mostrar."
            filterField="user_email"
            filterPlaceholder="Filtrar por correo..."
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Mis PQRS</h3>
              <p className="text-sm text-muted-foreground">
                Crea y consulta tus peticiones, quejas, reclamos o sugerencias.
              </p>
            </div>
            <PqrsForm
              creating={citizenHook.creating}
              userId={currentUser?.id ?? ""}
              userEmail={currentUser?.email ?? ""}
              onSubmit={citizenHook.create}
              onCreated={() => {
                void citizenHook.loadMyPqrs();
              }}
            />
          </div>

          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
              <Search className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Consultar por número de ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={ticketInput}
                  onChange={(e) => {
                    setTicketInput(e.target.value);
                  }}
                  placeholder="Ej. PQRS-20240001"
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    void (async () => {
                      const pqrs = await citizenHook.searchByTicket(
                        ticketInput.trim(),
                      );
                      if (pqrs) {
                        setDetailPqrs(pqrs);
                        setDetailOpen(true);
                      }
                    })();
                  }}
                  disabled={!ticketInput.trim() || citizenHook.ticketLoading}
                >
                  {citizenHook.ticketLoading ? "Buscando..." : "Buscar"}
                </Button>
                {citizenHook.ticketResult ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={citizenHook.clearTicketResult}
                  >
                    Limpiar
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de PQRS</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {citizenHook.loading && citizenHook.myPqrs.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Cargando PQRS...
                </p>
              ) : citizenHook.myPqrs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
                  <FileQuestion className="size-10 opacity-40" />
                  <p>No tienes PQRS registradas.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="divide-y">
                    {citizenHook.myPqrs.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full px-6 py-4 text-left transition-colors hover:bg-muted/50"
                        onClick={() => {
                          void handleOpenDetail(p);
                        }}
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold">
                            {p.ticket_number}
                          </span>
                          <PqrsStatusBadge status={p.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {typeLabels[p.type] ?? p.type}
                          {" · "}
                          {p.category
                            ? (categoryLabels[p.category] ?? p.category)
                            : "Sin clasificar"}
                          {" · "}
                          {formatDate(p.created_at)}
                        </p>
                        {p.description ? (
                          <p className="mt-1 line-clamp-2 text-sm">{p.description}</p>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <PqrsDetailDialog
        pqrs={detailPqrs}
        updates={
          isAdmin && detailPqrs
            ? (adminHook.updatesMap[detailPqrs.id] ?? [])
            : detailPqrs?.updates ?? []
        }
        updatesLoading={isAdmin ? adminHook.updatesLoading : false}
        savingUpdate={isAdmin ? adminHook.savingUpdate : false}
        open={detailOpen}
        mode={isAdmin ? "admin" : "citizen"}
        onClose={() => {
          setDetailOpen(false);
          setDetailPqrs(null);
        }}
        onLoadUpdates={isAdmin ? adminHook.loadUpdates : undefined}
        onAddUpdate={isAdmin ? adminHook.addUpdate : undefined}
      />
    </PageShell>
  );
}
