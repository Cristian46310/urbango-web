import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Bell, Megaphone } from "lucide-react";

import { AlertListItem } from "@/app/components/alerts/AlertListItem";
import { PageShell } from "@/app/components/security/page-shell";
import { useAlerts } from "@/hooks/alerts/useAlerts";
import { useAlertsSocket } from "@/hooks/alerts/useAlertsSocket";
import { useAlertsUnreadCount } from "@/hooks/alerts/useAlertsUnreadCount";
import type { UserAlert } from "@/core/types/alerts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function formatFullDate(value: string) {
  try {
    return format(new Date(value), "PPpp", { locale: es });
  } catch {
    return value;
  }
}

const scopeLabels: Record<UserAlert["scope"], string> = {
  all: "Todos los usuarios",
  route: "Usuarios por ruta",
  zone: "Usuarios por zona",
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alertFromQuery = searchParams.get("alert");
  const { refreshUnreadCount, decrementUnreadCount } = useAlertsUnreadCount();
  const {
    alerts,
    loading,
    prependAlert,
    readAlert,
    openAlert,
    loadAlerts,
  } = useAlerts();

  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<UserAlert | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const handleSelectAlert = useCallback(
    async (alertId: string) => {
      setActiveAlertId(alertId);
      setMobileShowDetail(true);

      const fromList = alerts.find((item) => item.id === alertId);
      if (fromList) {
        setActiveAlert(fromList);
      }

      const opened = await openAlert(alertId);
      if (opened) {
        setActiveAlert(opened);
        if (!opened.isRead) {
          decrementUnreadCount();
          const read = await readAlert(alertId);
          if (read) {
            setActiveAlert(read);
          }
          void refreshUnreadCount();
        }
      }
    },
    [alerts, openAlert, readAlert, refreshUnreadCount, decrementUnreadCount],
  );

  const handleIncomingAlert = useCallback(
    (alert: UserAlert) => {
      prependAlert(alert);
      void refreshUnreadCount();
    },
    [prependAlert, refreshUnreadCount],
  );

  const handleUrgentAlert = useCallback(
    (alert: UserAlert) => {
      handleIncomingAlert(alert);
    },
    [handleIncomingAlert],
  );

  useAlertsSocket({
    onNewAlert: handleIncomingAlert,
    onUrgentAlert: handleUrgentAlert,
  });

  useEffect(() => {
    if (alertFromQuery) {
      void handleSelectAlert(alertFromQuery);
      return;
    }
    if (!activeAlertId && alerts.length > 0) {
      void handleSelectAlert(alerts[0].id);
    }
  }, [alerts, activeAlertId, alertFromQuery, handleSelectAlert]);

  return (
    <PageShell
      title="Alertas"
      description="Avisos del sistema y comunicaciones unidireccionales. No puedes responder a estas alertas."
    >
      <Card className="overflow-hidden">
        <div className="grid min-h-[560px] lg:grid-cols-[320px_1fr]">
          <div className={cn("flex flex-col border-r border-(--security-border)", mobileShowDetail && "hidden lg:flex")}>
            <div className="flex items-center justify-between border-b border-(--security-border) px-4 py-3">
              <h3 className="font-semibold">Bandeja</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => { void loadAlerts(1); }}
              >
                Actualizar
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {loading && alerts.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Cargando alertas...</p>
              ) : alerts.length === 0 ? (
                <div className="space-y-3 p-6 text-center text-sm text-muted-foreground">
                  <Bell className="mx-auto size-8 opacity-60" />
                  <p>No tienes alertas.</p>
                </div>
              ) : (
                <div className="divide-y divide-(--security-border)">
                  {alerts.map((alert) => (
                    <AlertListItem
                      key={alert.id}
                      alert={alert}
                      active={activeAlertId === alert.id}
                      onSelect={(id) => { void handleSelectAlert(id); }}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className={cn("flex flex-col", !mobileShowDetail && "hidden lg:flex")}>
            {activeAlert ? (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-(--security-border) px-4 py-4">
                  <div className="min-w-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mb-2 lg:hidden"
                      onClick={() => { setMobileShowDetail(false); }}
                    >
                      ← Volver
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{activeAlert.title}</h3>
                      {activeAlert.isUrgent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                          <AlertTriangle className="size-3" />
                          Urgente
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeAlert.senderName ?? "Sistema"} · {formatFullDate(activeAlert.sentAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{scopeLabels[activeAlert.scope]}</p>
                  </div>
                  <Megaphone className="size-5 shrink-0 text-muted-foreground" />
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{activeAlert.body}</p>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Comunicación unidireccional — no es posible responder a esta alerta.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <Bell className="size-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Selecciona una alerta</p>
                  <p className="text-sm text-muted-foreground">
                    Aquí verás el detalle de avisos del sistema.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => { void navigate("/app/messaging"); }}>
                  Ir a mensajería
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
