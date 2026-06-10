import { useEffect, useMemo, useState, useRef } from "react";
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
import { FileSpreadsheet, Image } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminAgeDistributionPage() {
  const chartRef = useRef<ChartJS<"pie"> | null>(null);
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [routeId, setRouteId] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<AgeDistributionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const formattedRange = useMemo(() => {
    if (!startDate || !endDate) return "";
    return `${format(parseISO(startDate), "dd/MM/yyyy")} - ${format(parseISO(endDate), "dd/MM/yyyy")}`;
  }, [startDate, endDate]);

  useEffect(() => {
    void getRoutes()
      .then((data) => setRoutes(data))
      .catch((error) => {
        showErrorToast(`No se pudieron cargar las rutas: ${(error as Error).message}`);
      });
  }, []);

  const chartData = useMemo(() => {
    if (!report) return { labels: [], datasets: [] };

    return {
      labels: report.segments.map((segment) => segment.range),
      datasets: [
        {
          label: "Numero de Pasajeros",
          data: report.segments.map((segment) => segment.count),
          backgroundColor: [
            "#2563eb",
            "#22c55e",
            "#f59e0b",
            "#ec4899",
            "#14b8a6",
            "#64748b",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [report]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const rawValue = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((rawValue / total) * 100).toFixed(1);
            return ` Pasajeros: ${rawValue} (${percentage}%)`;
          },
        },
      },
    },
  };

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      showErrorToast("Debes seleccionar el rango de fechas inicial y final.");
      return;
    }

    try {
      setLoading(true);
      const qRouteId = routeId === "ALL" ? "" : routeId;
      const response = await getAgeDistribution({ routeId: qRouteId, startDate, endDate });
      setReport(response);
    } catch (error) {
      showErrorToast(`No se pudo consultar el reporte: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!startDate || !endDate) {
      showErrorToast("Selecciona el rango de fechas antes de exportar.");
      return;
    }

    try {
      const qRouteId = routeId === "ALL" ? "" : routeId;
      const blob = await exportAgeDistributionExcel({ routeId: qRouteId, startDate, endDate });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `distribucion-edad-${startDate}-a-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showSuccessToast("Exportacion Excel descargada correctamente.");
    } catch (error) {
      showErrorToast(`No se pudo exportar a Excel: ${(error as Error).message}`);
    }
  };

  const handleExportPNG = () => {
    if (!chartRef.current) return;
    
    const chart = chartRef.current;
    const base64Image = chart.toBase64Image();
    
    const link = document.createElement("a");
    link.download = `grafico-distribucion-etaria-${startDate || "consolidado"}.png`;
    link.href = base64Image;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showSuccessToast("Grafico exportado como PNG correctamente.");
  };

  return (
    <main className="space-y-6 p-6">
      <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-(--security-foreground)">Distribucion de edad de pasajeros</h1>
        <p className="mt-2 text-sm text-(--security-muted-foreground)">Filtra por ruta especifica o evalua el consolidado general de todo el sistema.</p>
        
        {formattedRange && (
          <p className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-md inline-block">
            Rango analizado: {formattedRange}
          </p>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="route-select">Ruta de Transporte</Label>
            <Select value={routeId} onValueChange={setRouteId}>
              <SelectTrigger id="route-select">
                <SelectValue placeholder="Seleccionar ruta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todo el Sistema (Consolidado)</SelectItem>
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
            <Button type="button" className="w-full lg:w-auto" onClick={handleSearch} disabled={loading}>
              Consultar
            </Button>
            <Button type="button" variant="outline" onClick={handleExportExcel} disabled={loading || !report} title="Exportar datos a Excel">
              <FileSpreadsheet className="size-4 mr-1" /> Excel
            </Button>
            <Button type="button" variant="outline" onClick={handleExportPNG} disabled={loading || !report} title="Exportar grafico como PNG">
              <Image className="size-4 mr-1" /> PNG
            </Button>
          </div>
        </div>
      </div>

      {report ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-(--security-foreground)">Grafico de distribucion porcentual</h2>
              <p className="text-xs text-muted-foreground">Pasa el cursor o haz clic en un fragmento para visualizar la metrica absoluta.</p>
            </div>
            <div className="mt-4 relative w-full h-[280px] md:h-[340px] mx-auto">
              <Pie ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="space-y-4 flex flex-col justify-start">
            <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
              <p className="text-sm font-medium text-(--security-muted-foreground)">Total de pasajeros evaluados</p>
              <p className="mt-2 text-4xl font-bold text-blue-600 dark:text-blue-400">{report.totalPassengers}</p>
            </div>
            
            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 p-6 shadow-sm border-l-4 border-l-amber-500">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white rounded">
                Predominante
              </span>
              <p className="text-sm font-medium text-(--security-muted-foreground) mt-2">Segmento mayoritario</p>
              <p className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">{report.dominantSegment}</p>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-(--security-foreground)">Detalle analitico por rango etario</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Rango Etario</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Cantidad Absoluta</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Porcentaje del Total</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Variacion vs Mes Anterior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {report.segments.map((segment) => (
                    <tr key={segment.range} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{segment.range}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{segment.count}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{segment.percentage}%</td>
                      <td className="px-4 py-3 font-medium">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          segment.variation.startsWith("-") 
                            ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" 
                            : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        }`}>
                          {segment.variation}
                        </span>
                      </td>
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