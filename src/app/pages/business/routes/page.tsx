import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";

import { DataTable } from "@/app/components/security/data-table";
import { PageShell } from "@/app/components/security/page-shell";
import { RowActionsDropdown } from "@/app/components/security/row-actions-dropdown";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";
import {
  RouteMapDesigner,
  type RouteDesignerMode,
  type RouteDesignerNode,
  type RouteDesignerValues,
} from "@/app/components/business/RouteMapDesigner";
import { toTablePagination } from "@/infra/repository/business/businessPageAdapter";
import { useRoute } from "@/hooks/business";
import type { Route } from "@/core/domain/entities/business";
import { Button } from "@/components/ui/button";
import { getRouteById } from "@/services/routePlanningService";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast } from "@/lib/toast";

type PageMode = "list" | RouteDesignerMode;

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

export default function RoutesPage() {
  const crud = useRoute();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(0);
  const [pageMode, setPageMode] = useState<PageMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [designerInitial, setDesignerInitial] = useState<
    Partial<RouteDesignerValues> | undefined
  >(undefined);
  const [designerKey, setDesignerKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const pagination = toTablePagination(crud.page?.meta ?? null);

  useEffect(() => {
    void crud.loadItems(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const openList = useCallback(() => {
    setPageMode("list");
    setEditingId(null);
    setDesignerInitial(undefined);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setDesignerInitial({
      name: "",
      description: "",
      price: "",
      nodes: [],
    });
    setDesignerKey((k) => k + 1);
    setPageMode("create");
    setSearchParams({ mode: "create" }, { replace: true });
  }, [setSearchParams]);

  const openDesigner = useCallback(
    async (mode: "edit" | "view", route: Route) => {
      setLoadingDetail(true);
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
        setPageMode(mode);
        setSearchParams({ mode, id: route.id }, { replace: true });
      } catch (error) {
        showErrorToast(
          getApiErrorMessage(error, "No se pudo cargar el detalle de la ruta"),
        );
        setDesignerInitial({
          name: route.name,
          description: route.description,
          price: route.price,
          nodes: [],
        });
        setDesignerKey((k) => k + 1);
        setPageMode(mode);
      } finally {
        setLoadingDetail(false);
      }
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (searchParams.get("mode") === "create") {
      openCreate();
    }
    // Deep-link only on first entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values: RouteDesignerValues) => {
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
      openList();
      await crud.loadItems(currentPage);
    } catch {
      // store toasts
    } finally {
      setSubmitting(false);
    }
  };

  const columnHelper = createColumnHelper<Route>();
  const columns = [
    columnHelper.accessor("name", { header: "Nombre" }),
    columnHelper.accessor("description", { header: "Descripción" }),
    columnHelper.accessor("price", { header: "Precio" }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const route = info.row.original;
        return (
          <RowActionsDropdown
            actions={[
              {
                label: "Ver",
                icon: Eye,
                onClick: () => {
                  void openDesigner("view", route);
                },
              },
              {
                label: "Editar",
                icon: Pencil,
                onClick: () => {
                  void openDesigner("edit", route);
                },
              },
              {
                label: "Borrar",
                icon: Trash2,
                variant: "destructive",
                onClick: () =>
                  void crud
                    .removeItem(route.id)
                    .then(() => crud.loadItems(currentPage)),
              },
            ]}
          />
        );
      },
    }),
  ];

  return (
    <PageShell
      title="Rutas"
      description="Lista, crea y consulta rutas con el mismo recorrido en mapa."
    >
      {pageMode === "list" ? (
        <DataTable
          title="Listado de rutas"
          description="Selecciona una ruta para verla o editarla, o crea una nueva con el mapa."
          data={crud.items}
          columns={columns}
          loading={crud.loading || loadingDetail}
          error={crud.error}
          onRefresh={() => {
            void crud.loadItems(currentPage);
          }}
          pageIndex={currentPage}
          pageSize={BUSINESS_PAGE_SIZE}
          pageCount={pagination.pageCount}
          totalItems={pagination.totalItems}
          onPageChange={setCurrentPage}
          filterField="name"
          toolbarAction={
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-1 size-4" />
              Nueva ruta
            </Button>
          }
        />
      ) : (
        <RouteMapDesigner
          key={designerKey}
          mode={pageMode}
          initialValues={designerInitial}
          submitting={submitting}
          onCancel={openList}
          onSubmit={handleSubmit}
        />
      )}
    </PageShell>
  );
}
