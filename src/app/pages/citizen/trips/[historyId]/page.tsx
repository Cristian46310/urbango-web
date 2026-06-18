import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bus, User } from 'lucide-react';
import { PageShell } from '@/app/components/security/page-shell';
import { RouteMap } from '@/app/components/transit/RouteMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTripDetails } from '@/services/ticketService';
import type { TripDetails } from '@/services/ticketService';
import { orderedRouteStops } from '@/services/routePlanningService';
import { getApiErrorMessage } from '@/lib/api-error';
import { showErrorToast } from '@/lib/toast';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

const validationLabels: Record<string, string> = {
  boarding: 'Abordaje',
  alighting: 'Descenso',
};

export default function CitizenTripDetailPage() {
  const { historyId = '' } = useParams();
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!historyId) return;
    setLoading(true);
    void getTripDetails(historyId)
      .then(setTrip)
      .catch((error) => {
        showErrorToast(getApiErrorMessage(error, 'No se pudo cargar el detalle del viaje'));
      })
      .finally(() => setLoading(false));
  }, [historyId]);

  const routeStops = useMemo(() => {
    if (!trip?.route) return [];
    return orderedRouteStops(trip.route).map((stop) => ({
      id: stop.id,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      order: stop.order,
      location: stop.location,
    }));
  }, [trip]);

  return (
    <PageShell
      title="Detalle del viaje"
      description="Ruta, validaciones y datos del servicio"
    >
      <Button asChild variant="ghost" className="mb-4 -ml-2">
        <Link to="/app/trips">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al historial
        </Link>
      </Button>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando viaje...</p>
      ) : !trip ? (
        <p className="text-sm text-muted-foreground">Viaje no encontrado.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Duración</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{trip.totalTime.formatted}</p>
              </CardContent>
            </Card>
            {trip.bus ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Bus className="h-4 w-4" /> Bus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{trip.bus.plate}</p>
                </CardContent>
              </Card>
            ) : null}
            {trip.driver ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <User className="h-4 w-4" /> Conductor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{trip.driver.name}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {routeStops.length > 0 ? (
            <RouteMap stops={routeStops} heightClassName="h-96" />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {trip.validations
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((v, index) => (
                    <li
                      key={`${v.order}-${v.validatedAt}-${String(index)}`}
                      className="flex flex-col gap-1 border-b pb-3 last:border-0 text-sm"
                    >
                      <p className="font-medium">
                        {v.order}. {v.stop.name} — {validationLabels[v.type] ?? v.type}
                      </p>
                      <p className="text-muted-foreground">{formatDateTime(v.validatedAt)}</p>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
