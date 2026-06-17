import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { UrgentAlertDialog } from "@/app/components/alerts/UrgentAlertDialog";
import { useAlertsSocket } from "@/hooks/alerts/useAlertsSocket";
import { useAlertsUnreadCount } from "@/hooks/alerts/useAlertsUnreadCount";
import type { UserAlert } from "@/core/types/alerts";
import { showInfoToast } from "@/lib/toast";

interface GlobalAlertsListenerProps {
  enabled?: boolean;
}

export function GlobalAlertsListener({ enabled = true }: GlobalAlertsListenerProps) {
  const navigate = useNavigate();
  const { refreshUnreadCount } = useAlertsUnreadCount(enabled);
  const [urgentAlert, setUrgentAlert] = useState<UserAlert | null>(null);

  const handleNewAlert = useCallback(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  const handleUrgentAlert = useCallback(
    (alert: UserAlert) => {
      setUrgentAlert(alert);
      void refreshUnreadCount();
      showInfoToast(`Alerta urgente: ${alert.title}`);
    },
    [refreshUnreadCount],
  );

  useAlertsSocket({
    enabled,
    onNewAlert: handleNewAlert,
    onUrgentAlert: handleUrgentAlert,
  });

  return (
    <UrgentAlertDialog
      alert={urgentAlert}
      onOpenChange={(open) => {
        if (!open) setUrgentAlert(null);
      }}
      onView={(alertId) => {
        void navigate(`/app/alerts?alert=${alertId}`);
      }}
    />
  );
}
