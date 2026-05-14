import { useEffect, useState } from "react";
import { ArrowDownToLine, AlertCircle, CheckCircle2, Clock3, Ticket } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { PageShell } from "@/app/components/security/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function TicketAlightPage() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [ticketIdInput, setTicketIdInput] = useState(ticketId ?? "");
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  useEffect(() => {
    if (ticketId) {
      setTicketIdInput(ticketId);
      setCompletedAt(null);
    }
  }, [ticketId]);

  const activeTicketId = ticketId?.trim() || ticketIdInput.trim();

  const openTicket = () => {
    const normalizedTicketId = ticketIdInput.trim();

    if (!normalizedTicketId) {
      toast.error("Ingresa un ticketId para continuar");
      return;
    }

    void navigate(`/app/ticket/${normalizedTicketId}/alight`);
  };

  const completeTrip = () => {
    if (!activeTicketId) {
      toast.error("El sistema necesita un ticket activo para cerrar el viaje");
      return;
    }

    const finishedAt = new Date().toISOString();
    setCompletedAt(finishedAt);
    toast.success("Viaje completado - Gracias por usar nuestro servicio");
  };

  return (
    <PageShell
      title="Descenso y cierre de viaje"
      description="Valida tu salida al descender del bus para cerrar el viaje dentro de esta misma ventana."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-(--security-border) bg-(--security-surface) shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-(--security-foreground)">
              <ArrowDownToLine className="size-5" />
              Validación de descenso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--security-foreground)" htmlFor="ticket-id">
                Ticket activo
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="ticket-id"
                  value={ticketIdInput}
                  onChange={(event) => setTicketIdInput(event.target.value)}
                  placeholder="Ingresa el ticketId"
                  className="sm:max-w-md"
                />
                <Button type="button" variant="outline" onClick={openTicket}>
                  Abrir ticket
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-(--security-border) bg-card p-4 text-sm text-(--security-muted-foreground)">
              El sistema identifica el boleto activo en este bus, registra el descenso con timestamp, marca el viaje como completado y libera el cupo para otro pasajero.
            </div>

            <Button type="button" className="w-full sm:w-auto" onClick={completeTrip} disabled={!activeTicketId}>
              Marcar viaje como completado
            </Button>
          </CardContent>
        </Card>

        <Card className="border-(--security-border) bg-(--security-surface) shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-(--security-foreground)">
              <Ticket className="size-5" />
              Estado del viaje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedAt ? (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Viaje completado - Gracias por usar nuestro servicio</p>
                    <p className="mt-1 text-sm text-emerald-800">El cupo en el bus quedó disponible para otro pasajero.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock3 className="size-4" />
                  <span>Hora de finalización: {new Date(completedAt).toLocaleString()}</span>
                </div>

                <div className="rounded-xl bg-white/70 px-3 py-2 text-sm">
                  <span className="font-medium">Ticket:</span> {activeTicketId}
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Aun no se ha cerrado el viaje</p>
                    <p className="mt-1 text-sm text-amber-800">Ingresa un ticketId y confirma el descenso para completar la validación.</p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/70 px-3 py-2 text-sm">
                  <span className="font-medium">Ruta activa:</span> {ticketId ? `/app/ticket/${ticketId}/alight` : "/app/ticket/alight"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}