import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Plus, Route, Search, Trash2 } from "lucide-react";
import { PageShell } from "@/app/components/security/page-shell";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RouteMapDesigner,
  type RouteDesignerMode,
  type RouteDesignerNode,
  type RouteDesignerValues,
} from "@/app/components/business/RouteMapDesigner";
import { listRoutes } from "@/services/routePlanningService";
import type { RouteListItem } from "@/services/routePlanningService";
import { getRouteById } from "@/services/routePlanningService";
import { useRoute } from "@/hooks/business";
import { useAuthStore } from "@/store/security/authStore";
import { ROLES } from "@/core/domain/entities/security/Roles";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast } from "@/lib/toast";
import { formatCop } from "@/lib/currency";

const ROUTE_MANAGER_ROLES = [
  ROLES.ADMIN,
  ROLES.BUSINESS_ADMIN,
  ROLES.SUPERVISOR,
  ROLES.ADMIN_BUS,
  ROLES.SUPERVISER,
] as const;

type PageMode = "browse" | RouteDesignerMode;

function nodesFromRouteDetail(
  detail: Awaited<ReturnType<typeof getRouteById>>,
): RouteDesignerNode[] {
  const nodes = [...(detail.nodes ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  return nodes.map((node, index) => {
    const lat = Number(node.stop?.latitude ?? 0);
    const lng = Number(node.stop?.longitude ?? 0);
    const prev = nodes[index - 1];
    const prevLat = Number(prev?.stop?.latitude ?? lat);
    const prevLng = Number(prev?.stop?.longitude ?? lng);
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat - prevLat);
    const dLon = toRad(lng - prevLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(prevLat)) *
        Math.cos(toRad(lat)) *
        Math.sin(dLon / 2) ** 2;
    const distance =
      index === 0 ? 0 : Math.round(2 * R * Math.asin(Math.sqrt(a)));

    return {
      stopId: node.stop?.id ?? `node-${String(index)}`,
      stopName: node.stop?.name ?? `Parada ${String(index + 1)}`,
      lat,
      lng,
      order: node.order ?? index + 1,
      distanceFromPrevious: distance,
      estimatedTimeMinutes:
        index === 0 ? 0 : Math.max(0, node.estimatedTimeMinutes ?? 0),
    };
  });
}

export default function CitizenRoutesPage() {
  const { hasAnyRole } = useAuthStore();
  const canManageRoutes = hasAnyRole(ROUTE_MANAGER_ROLES);
  const crud = useRoute();
  const [searchParams, setSearchParams] = useSearchParams();

  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  const [pageMode, setPageMode] = useState<PageMode>("browse");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [designerInitial, setDesignerInitial] = useState<
    Partial<RouteDesignerValues> | undefined
  >(undefined);
  const [designerKey, setDesignerKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadRoutes = useCallback(async (name?: string) => {
    setLoading(true);
    try {
      const page = await listRoutes(name);
      setRoutes(page.items);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "No se pudieron cargar las rutas"));
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
    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    void loadRoutes(nameFilter || undefined);
  }, [nameFilter, loadRoutes]);

  const openBrowse = useCallback(() => {
    setPageMode("browse");
    setEditingId(null);
    setDesignerInitial(undefined);
    setSearchParams({}, { replace: true });
    void loadRoutes(nameFilter || undefined);
  }, [loadRoutes, nameFilter, setSearchParams]);

  const openCreate = useCallback(() => {
    if (!canManageRoutes) return;
    setEditingId(null);
    setDesignerInitial({ name: "", description: "", price: "", nodes: [] });
    setDesignerKey((k) => k + 1);
    setPageMode("create");
    setSearchParams({ mode: "create" }, { replace: true });
  }, [canManageRoutes, setSearchParams]);

  const openEdit = useCallback(
    async (route: RouteListItem) => {
      if (!canManageRoutes) return;
      setEditingId(route.id);
      try {
        const detail = await getRouteById(route.id);
        setDesignerInitial({
          name: detail.name ?? route.name,
          description: detail.description ?? route.description,
          price: detail.price ?? route.price,
          nodes: nodesFromRouteDetail(detail),
        });
        setDesignerKey((k) => k + 1);
        setPageMode("edit");
        setSearchParams({ mode: "edit", id: route.id }, { replace: true });
      } catch (error) {
        showErrorToast(
          getApiErrorMessage(error, "No se pudo cargar el detalle de la ruta"),
        );
      }
    },
    [canManageRoutes, setSearchParams],
  );

  useEffect(() => {
    if (canManageRoutes && searchParams.get("mode") === "create") {
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageRoutes]);

  const handleSubmit = async (values: RouteDesignerValues) => {
    if (!canManageRoutes) return;
    setSubmitting(true);
    try {
      if (pageMode === "create") {
        if (values.nodes.length < 3) {
          showErrorToast("La ruta debe tener al menos 3 paradas");
          return;
        }
        await crud.addItem({
          name: values.name,
          description: values.description,
          price: Number(values.price),
          nodes: values.nodes.map((node) => ({
            order: node.order,
            stopId: node.stopId,
            estimatedTimeMinutes: node.estimatedTimeMinutes,
          })),
        });
      } else if (pageMode === "edit" && editingId) {
        await crud.editItem(editingId, {
          name: values.name,
          description: values.description,
          price: Number(values.price),
        });
      }
      openBrowse();
    } catch {
      // store toasts
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (routeId: string) => {
    if (!canManageRoutes) return;
    try {
      await crud.removeItem(routeId);
      await loadRoutes(nameFilter || undefined);
    } catch {
      // store toasts
    }
  };

  if (pageMode === "create" || pageMode === "edit") {
    if (!canManageRoutes) {
      return (
        <PageShell title="Rutas" description="No tienes permiso para gestionar rutas.">
          <Button type="button" variant="outline" onClick={openBrowse}>
            Volver
          </Button>
        </PageShell>
      );
    }
    return (
      <PageShell
        title="Rutas"
        description="Diseña o edita el recorrido en el mapa."
      >
        <RouteMapDesigner
          key={designerKey}
          mode={pageMode}
          initialValues={designerInitial}
          submitting={submitting}
          onCancel={openBrowse}
          onSubmit={handleSubmit}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Rutas"
      description={
        canManageRoutes
          ? "Consulta rutas disponibles. Como administrador puedes crear y editar recorridos."
          : "Explora rutas disponibles, tarifas y paraderos en el mapa."
      }
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filtrar por nombre de ruta..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void loadRoutes(nameFilter || undefined);
          }}
        >
          Actualizar
        </Button>
        {canManageRoutes ? (
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Nueva ruta
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando rutas...</p>
      ) : routes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay rutas que coincidan con el filtro.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {routes.map((route) => (
            <Card
              key={route.id}
              className="hover:border-primary/40 transition-colors"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Route className="h-5 w-5 text-primary" />
                  {route.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {route.description || "Sin descripción"}
                </p>
                <p className="text-base font-semibold">
                  Tarifa: {formatCop(route.price)}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="secondary" className="flex-1">
                    <Link to={`/app/planning/routes/${route.id}`}>
                      Ver ruta y mapa
                    </Link>
                  </Button>
                  {canManageRoutes ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Editar ruta"
                        onClick={() => {
                          void openEdit(route);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Eliminar ruta"
                        onClick={() => {
                          void handleDelete(route.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
