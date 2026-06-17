import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CloudSun, CloudOff, Pencil, Trash2 } from "lucide-react";

import { PageShell } from "@/app/components/security/page-shell";
import { WeatherAlertForm } from "@/app/components/profile/WeatherAlertForm";
import type { WeatherAlert } from "@/core/types/weather";
import { useWeatherAlerts } from "@/hooks/weather/useWeatherAlerts";
import { useAuthStore } from "@/store/security/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const channelLabels: Record<string, string> = {
  email: "Correo electrónico",
  whatsapp: "WhatsApp",
  push: "Notificación push",
};

function formatDate(value: string | null) {
  if (!value) return "Nunca";
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: es });
  } catch {
    return value;
  }
}

export default function ProfilePreferencesPage() {
  const { currentUser } = useAuthStore();
  const { alerts, loading, saving, create, update, deactivate } = useWeatherAlerts(
    currentUser?.id ?? null,
  );
  const [editTarget, setEditTarget] = useState<WeatherAlert | null>(null);

  return (
    <PageShell
      title="Preferencias de viaje"
      description="Configura alertas de clima para tu horario habitual de viaje."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Mis alertas de clima</h3>
            <p className="text-sm text-muted-foreground">
              Recibe notificaciones cuando el clima no sea favorable para viajar.
            </p>
          </div>
          <WeatherAlertForm
            userId={currentUser?.id ?? ""}
            userEmail={currentUser?.email ?? ""}
            saving={saving}
            editTarget={editTarget}
            onCreateSubmit={create}
            onUpdateSubmit={update}
            onEditClear={() => { setEditTarget(null); }}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferencias configuradas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading && alerts.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Cargando preferencias...
              </p>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
                <CloudSun className="size-10 opacity-40" />
                <p>No tienes preferencias de clima configuradas.</p>
                <p className="text-xs">
                  Crea una para recibir alertas antes de tu viaje.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between gap-4 px-6 py-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{alert.city_name}</span>
                        {alert.is_active ? (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactiva
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Horario de viaje:{" "}
                        <span className="font-medium text-foreground">
                          {String(alert.travel_hour).padStart(2, "0")}:00
                        </span>{" "}
                        · Canal:{" "}
                        <span className="font-medium text-foreground">
                          {channelLabels[alert.preferred_channel] ?? alert.preferred_channel}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Última alerta enviada: {formatDate(alert.last_alert_sent_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Editar"
                        onClick={() => { setEditTarget(alert); }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {alert.is_active && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          title="Desactivar"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { void deactivate(alert.id); }}
                        >
                          <CloudOff className="size-4" />
                        </Button>
                      )}
                      <span title="Desactivar" className="hidden">
                        <Trash2 className="size-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
