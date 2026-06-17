import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Map } from 'lucide-react';
import { PageShell } from '@/app/components/security/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { myTickets } from '@/services/ticketService';
import type { CitizenTicket } from '@/services/ticketService';
import { getApiErrorMessage } from '@/lib/api-error';
import { showErrorToast } from '@/lib/toast';
import { formatCop } from '@/lib/currency';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function CitizenTripsPage() {
  const [tickets, setTickets] = useState<CitizenTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const page = await myTickets({ status: 'completed', page: 1, limit: 20 });
      setTickets(page.items);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'No se pudo cargar el historial'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <PageShell
      title="Historial de viajes"
      description="Consulta tus viajes completados y abre el detalle en el mapa."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando historial...</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no tienes viajes completados.</p>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  Boleto {ticket.id.slice(0, 8)}…
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-muted-foreground">
                  {ticket.routeName ? <p>Ruta: {ticket.routeName}</p> : null}
                  {ticket.busPlate ? <p>Bus: {ticket.busPlate}</p> : null}
                  <p>Completado: {formatDate(ticket.completedAt)}</p>
                  {ticket.amount != null ? (
                    <p className="font-medium text-foreground">Tarifa: {formatCop(ticket.amount)}</p>
                  ) : null}
                </div>
                {ticket.historyId ? (
                  <Button asChild variant="secondary">
                    <Link to={`/app/trips/${ticket.historyId}`}>
                      <Map className="mr-2 h-4 w-4" />
                      Ver en mapa
                    </Link>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin historial de validación</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
