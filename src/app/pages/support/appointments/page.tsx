import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarX2, CalendarClock } from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { DataTable } from "@/app/components/security/data-table";
import { AppointmentForm } from "@/app/components/support/AppointmentForm";
import { AppointmentEditDialog } from "@/app/components/support/AppointmentEditDialog";
import {
  AppointmentTypeBadge,
  AppointmentReasonBadge,
} from "@/app/components/support/AppointmentStatusBadge";
import type { Appointment, UpdateAppointmentRequest } from "@/core/types/appointments";
import { useAppointments } from "@/hooks/appointments/useAppointments";
import { useAppointmentsAdmin } from "@/hooks/appointments/useAppointmentsAdmin";
import { useAuthStore } from "@/store/security/authStore";
import { ROLE_GROUPS } from "@/core/domain/entities/security/Roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatDate(value: string) {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: es });
  } catch {
    return value;
  }
}

const columnHelper = createColumnHelper<Appointment>();

export default function SupportAppointmentsPage() {
  const { currentUser, hasAnyRole } = useAuthStore();
  const isAdmin = hasAnyRole(ROLE_GROUPS.ADMIN_ROLES);

  const {
    myAppointments,
    availability,
    loading,
    availabilityLoading,
    creating,
    loadAvailability,
    create,
    cancel,
  } = useAppointments(currentUser?.id ?? null);

  const adminHook = useAppointmentsAdmin();

  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleEdit = (appointment: Appointment) => {
    setEditTarget(appointment);
    setEditOpen(true);
  };

  const handleSaveEdit = async (id: string, payload: UpdateAppointmentRequest) => {
    return adminHook.update(id, payload);
  };

  const columns = [
    columnHelper.accessor("user_email", {
      header: "Usuario",
      cell: (info) => (
        <span className="text-xs text-muted-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("type", {
      header: "Tipo",
      cell: (info) => <AppointmentTypeBadge type={info.getValue()} />,
    }),
    columnHelper.accessor("reason", {
      header: "Motivo",
      cell: (info) => <AppointmentReasonBadge reason={info.getValue()} />,
    }),
    columnHelper.accessor("date_time", {
      header: "Fecha y hora",
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.accessor("description", {
      header: "Descripción",
      cell: (info) => (
        <span className="text-xs">{info.getValue() || "—"}</span>
      ),
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
            onClick={() => { handleEdit(row.original); }}
          >
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => { void adminHook.remove(row.original.id); }}
          >
            Eliminar
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      title="Citas de reclamos"
      description="Agenda tu cita de atención al cliente o gestiona las citas del sistema."
    >
      {isAdmin ? (
        <DataTable
          columns={columns}
          data={adminHook.appointments}
          title="Todas las citas"
          description="Listado completo de citas registradas en el sistema."
          loading={adminHook.loading}
          onRefresh={adminHook.load}
          emptyMessage="No hay citas registradas."
          filterField="user_email"
          filterPlaceholder="Filtrar por correo..."
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Mis citas</h3>
              <p className="text-sm text-muted-foreground">
                Agenda y administra tus citas de reclamos.
              </p>
            </div>
            <AppointmentForm
              slots={availability?.slots ?? []}
              slotsLoading={availabilityLoading}
              creating={creating}
              userId={currentUser?.id ?? ""}
              userEmail={currentUser?.email ?? ""}
              onLoadSlots={() => { void loadAvailability(); }}
              onSubmit={create}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Próximas citas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading && myAppointments.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Cargando citas...
                </p>
              ) : myAppointments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
                  <CalendarClock className="size-10 opacity-40" />
                  <p>No tienes citas agendadas.</p>
                  <p className="text-xs">Usa el botón "Agendar cita" para crear una nueva.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="divide-y">
                    {myAppointments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between px-6 py-4"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <AppointmentTypeBadge type={a.type} />
                            <AppointmentReasonBadge reason={a.reason} />
                          </div>
                          <p className="text-sm font-medium">{formatDate(a.date_time)}</p>
                          {a.description && (
                            <p className="text-xs text-muted-foreground">{a.description}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => { void cancel(a.id); }}
                        >
                          <CalendarX2 className="size-4" />
                          <span className="sr-only">Cancelar</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AppointmentEditDialog
        appointment={editTarget}
        open={editOpen}
        saving={adminHook.updating}
        onClose={() => { setEditOpen(false); setEditTarget(null); }}
        onSave={handleSaveEdit}
      />
    </PageShell>
  );
}
