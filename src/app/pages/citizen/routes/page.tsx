import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Route, Search } from 'lucide-react';
import { PageShell } from '@/app/components/security/page-shell';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listRoutes } from '@/services/routePlanningService';
import type { RouteListItem } from '@/services/routePlanningService';
import { getApiErrorMessage } from '@/lib/api-error';
import { showErrorToast } from '@/lib/toast';
import { formatCop } from '@/lib/currency';

export default function CitizenRoutesPage() {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRoutes = useCallback(async (name?: string) => {
    setLoading(true);
    try {
      const page = await listRoutes(name);
      setRoutes(page.items);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'No se pudieron cargar las rutas'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNameFilter(searchInput);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadRoutes(nameFilter || undefined);
  }, [nameFilter, loadRoutes]);

  return (
    <PageShell
      title="Consulta de rutas"
      description="Explora rutas disponibles, tarifas y paraderos en el mapa."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filtrar por nombre de ruta..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void loadRoutes(nameFilter || undefined)}>
          Actualizar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando rutas...</p>
      ) : routes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay rutas que coincidan con el filtro.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {routes.map((route) => (
            <Card key={route.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Route className="h-5 w-5 text-primary" />
                  {route.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {route.description || 'Sin descripción'}
                </p>
                <p className="text-base font-semibold">Tarifa: {formatCop(route.price)}</p>
                <Button asChild variant="secondary" className="w-full">
                  <Link to={`/app/planning/routes/${route.id}`}>Ver ruta y mapa</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
