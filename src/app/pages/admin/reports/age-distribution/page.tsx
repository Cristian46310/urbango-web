import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Pie } from "react-chartjs-2";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAgeDistribution, exportAgeDistributionExcel } from "@/services/analyticsService";
import type { AgeDistributionResponse } from "@/services/analyticsService";
import { getRoutes } from "@/services/routeService";
import type { RouteListItem } from "@/services/routeService";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminAgeDistributionPage() {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [routeId, setRouteId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<AgeDistributionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const formattedRange = useMemo(() => {
    if (!startDate || !endDate) {
      return "";
    }
    return `${format(parseISO(startDate), "dd/MM/yyyy")} - ${format(parseISO(endDate), "dd/MM/yyyy")}`;
  }, [startDate, endDate]);

  useEffect(() => {
    void getRoutes()
      .then(setRoutes)
      .catch((error) => {
        showErrorToast(`No se pudieron cargar las rutas: ${(error as Error).message}`);
      });
  }, []);

  const chartData = useMemo(() => {
    if (!report) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: report.segments.map((segment) => segment.range),
      datasets: [
        {
          data: report.segments.map((segment) => segment.count),
          backgroundColor: ["#2563eb", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#64748b"],
          borderWidth: 1,
        },
      ],
    };
  }, [report]);

  const handleSearch = async () => {
    if (!routeId || !startDate || !endDate) {
      showErrorToast("Debes seleccionar ruta, fecha inicial y fecha final.");
      return;
    }

    try {
      setLoading(true);
      const response = await getAgeDistribution({ routeId, startDate, endDate });
      setReport(response);
    } catch (error) {
      showErrorToast(`No se pudo consultar el reporte: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!routeId || !startDate || !endDate) {
      showErrorToast("Selecciona ruta y fechas antes de exportar.");
      return;
    }

    try {
      const blob = await exportAgeDistributionExcel({ routeId, startDate, endDate });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "age-distribution.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showSuccessToast("Exportación Excel descargada correctamente.");
    } catch (error) {
      showErrorToast(`No se pudo exportar: ${(error as Error).message}`);
    }
  };

  return (
    <main className="space-y-6 p-6">
      <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-(--security-foreground)">Distribución de edad de pasajeros</h1>
        <p className="mt-2 text-sm text-(--security-muted-foreground)">Filtra por ruta y rango de fechas para revisar el comportamiento de los pasajeros.</p>
        {formattedRange ? (
          <p className="mt-2 text-sm text-(--security-muted-foreground)">Rango seleccionado: {formattedRange}</p>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="route-select">Ruta</Label>
            <Select value={routeId} onValueChange={setRouteId}>
              <SelectTrigger id="route-select">
                <SelectValue placeholder="Seleccionar ruta" />
              </SelectTrigger>
              <SelectContent>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Fecha inicio</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">Fecha fin</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>

          <div className="flex items-end gap-2">
            <Button type="button" onClick={handleSearch} disabled={loading}>
              Consultar
            </Button>
            <Button type="button" variant="secondary" onClick={handleExport} disabled={loading || !report}>
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {report ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-(--security-foreground)">Gráfico de distribución</h2>
            <div className="mt-6">
              <Pie data={chartData} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
              <p className="text-sm text-(--security-muted-foreground)">Total de pasajeros</p>
              <p className="mt-2 text-3xl font-semibold text-(--security-foreground)">{report.totalPassengers}</p>
            </div>
            <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
              <p className="text-sm text-(--security-muted-foreground)">Segmento predominante</p>
              <p className="mt-2 text-xl font-semibold text-(--security-foreground)">{report.dominantSegment}</p>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-(--security-foreground)">Detalle por rango</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700">Rango</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Cantidad</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Porcentaje</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.segments.map((segment) => (
                    <tr key={segment.range}>
                      <td className="px-4 py-3 text-slate-700">{segment.range}</td>
                      <td className="px-4 py-3 text-slate-700">{segment.count}</td>
                      <td className="px-4 py-3 text-slate-700">{segment.percentage}%</td>
                      <td className="px-4 py-3 text-slate-700">{segment.variation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
