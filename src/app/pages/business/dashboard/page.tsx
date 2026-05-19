import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { PageShell } from "@/app/components/security/page-shell";
import { useDashboard, useEnterprise } from "@/hooks/business";
import { BUSINESS_LOOKUP_PAGE_SIZE, formatChartColor } from "@/app/components/business/constants";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const MONTH_OPTIONS = [3, 6, 12] as const;

export default function BusinessDashboardPage() {
  const {
    paymentIncome,
    incidentTrend,
    loading,
    loadPaymentIncome,
    loadIncidentTrend,
    exportPaymentIncome,
    exportIncidentTrend,
  } = useDashboard();
  const enterpriseCrud = useEnterprise();

  const [incomeMonths, setIncomeMonths] = useState<number>(6);
  const [trendMonths, setTrendMonths] = useState<number>(12);
  const [enterpriseId, setEnterpriseId] = useState<string>("all");
  const [enterpriseOptions, setEnterpriseOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    void loadPaymentIncome(incomeMonths);
  }, [incomeMonths, loadPaymentIncome]);

  useEffect(() => {
    void loadIncidentTrend(trendMonths, enterpriseId === "all" ? undefined : enterpriseId);
  }, [trendMonths, enterpriseId, loadIncidentTrend]);

  useEffect(() => {
    void enterpriseCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setEnterpriseOptions(p.items.map((e) => ({ value: e.id, label: e.name })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const incomeChartData = useMemo(() => {
    if (!paymentIncome) return [];
    return paymentIncome.labels.map((label, index) => {
      const row: Record<string, string | number> = { month: label };
      paymentIncome.datasets.forEach((ds) => {
        row[ds.paymentMethodId] = ds.data[index] ?? 0;
      });
      return row;
    });
  }, [paymentIncome]);

  const incomeChartConfig = useMemo(() => {
    if (!paymentIncome) return {} satisfies ChartConfig;
    const config: ChartConfig = {};
    paymentIncome.datasets.forEach((ds, i) => {
      config[ds.paymentMethodId] = {
        label: ds.paymentMethodName,
        color: formatChartColor(i),
      };
    });
    return config;
  }, [paymentIncome]);

  const trendChartData = useMemo(() => {
    if (!incidentTrend) return [];
    return incidentTrend.labels.map((label, index) => {
      const row: Record<string, string | number> = { month: label };
      incidentTrend.datasets.forEach((ds) => {
        row[ds.type] = ds.data[index] ?? 0;
      });
      return row;
    });
  }, [incidentTrend]);

  const trendChartConfig = useMemo(() => {
    if (!incidentTrend) return {} satisfies ChartConfig;
    const config: ChartConfig = {};
    incidentTrend.datasets.forEach((ds, i) => {
      config[ds.type] = {
        label: ds.typeLabel,
        color: formatChartColor(i),
      };
    });
    return config;
  }, [incidentTrend]);

  return (
    <PageShell
      title="Dashboard Business"
      description="Analítica de ingresos e incidentes."
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Ingresos por método de pago</CardTitle>
              <CardDescription>
                Total: {paymentIncome ? paymentIncome.grandTotal.toLocaleString() : "—"}
                {paymentIncome && paymentIncome.excludedTicketsCount > 0
                  ? ` · ${String(paymentIncome.excludedTicketsCount)} tickets excluidos`
                  : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={String(incomeMonths)}
                onValueChange={(v) => { setIncomeMonths(Number(v)); }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} meses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void exportPaymentIncome(incomeMonths)}
              >
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !paymentIncome ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : incomeChartData.length > 0 ? (
              <ChartContainer config={incomeChartConfig} className="h-[360px] w-full">
                <BarChart data={incomeChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {paymentIncome?.datasets.map((ds) => (
                    <Bar
                      key={ds.paymentMethodId}
                      dataKey={ds.paymentMethodId}
                      stackId="income"
                      fill={`var(--color-${ds.paymentMethodId})`}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos para el período.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Evolución de incidentes por tipo</CardTitle>
              <CardDescription>
                Total: {incidentTrend?.grandTotal ?? "—"}
                {incidentTrend?.scope.enterpriseName
                  ? ` · ${incidentTrend.scope.enterpriseName}`
                  : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={String(trendMonths)}
                onValueChange={(v) => { setTrendMonths(Number(v)); }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} meses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={enterpriseId} onValueChange={setEnterpriseId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {enterpriseOptions.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  void exportIncidentTrend(
                    trendMonths,
                    enterpriseId === "all" ? undefined : enterpriseId,
                  )
                }
              >
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !incidentTrend ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : trendChartData.length > 0 ? (
              <ChartContainer config={trendChartConfig} className="h-[360px] w-full">
                <LineChart data={trendChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {incidentTrend?.datasets.map((ds) => (
                    <Line
                      key={ds.type}
                      type="monotone"
                      dataKey={ds.type}
                      stroke={`var(--color-${ds.type})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos para el período.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
