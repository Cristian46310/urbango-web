import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { PageShell } from '@/app/components/security/page-shell';
import { RouteMap } from '@/app/components/transit/RouteMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getRouteById,
  orderedRouteStops,
  totalRouteMinutes,
} from '@/services/routePlanningService';
import type { RouteDetail } from '@/services/routePlanningService';
import { getApiErrorMessage } from '@/lib/api-error';
import { showErrorToast } from '@/lib/toast';
import { formatCop } from '@/lib/currency';

export default function CitizenRouteDetailPage() {
  const { id = '' } = useParams();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void getRouteById(id)
      .then(setRoute)
      .catch((error) => {
        showErrorToast(getApiErrorMessage(error, 'No se pudo cargar la ruta'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const stops = useMemo(() => {
    if (!route) return [];
    return orderedRouteStops(route).map((stop) => ({
      id: stop.id,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      order: stop.order,
      location: stop.location,
    }));
  }, [route]);

  const totalMinutes = route ? totalRouteMinutes(route) : 0;

  return (
    <PageShell
      title={route?.name ?? 'Detalle de ruta'}
      description={route?.description ?? 'Paraderos en orden de recorrido'}
    >
      <Button asChild variant="ghost" className="mb-4 -ml-2">
        <Link to="/app/planning/routes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al listado
        </Link>
      </Button>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando ruta...</p>
      ) : !route ? (
        <p className="text-sm text-muted-foreground">Ruta no encontrada.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tarifa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{formatCop(route.price)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tiempo estimado total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{totalMinutes} min</p>
              </CardContent>
            </Card>
          </div>

          <RouteMap stops={stops} heightClassName="h-96" />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paraderos ({stops.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {stops.map((stop) => (
                  <li key={`${stop.id}-${String(stop.order)}`} className="flex gap-3 text-sm">
                    <span className="font-semibold text-primary w-6">{stop.order}.</span>
                    <div>
                      <p className="font-medium">{stop.name}</p>
                      {stop.location ? (
                        <p className="text-muted-foreground">{stop.location}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
