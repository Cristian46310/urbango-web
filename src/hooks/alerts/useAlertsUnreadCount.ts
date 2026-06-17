import { useCallback, useEffect } from "react";

import { useAlertsUnreadCountStore } from "@/store/alerts/alertsUnreadCountStore";

export function useAlertsUnreadCount(enabled = true) {
  const count = useAlertsUnreadCountStore((state) => state.count);
  const refreshUnreadCountFromStore = useAlertsUnreadCountStore((state) => state.refreshUnreadCount);
  const decrementUnreadCount = useAlertsUnreadCountStore((state) => state.decrementUnreadCount);

  const refreshUnreadCount = useCallback(async () => {
    return refreshUnreadCountFromStore(enabled);
  }, [enabled, refreshUnreadCountFromStore]);

  useEffect(() => {
    void refreshUnreadCountFromStore(enabled);
  }, [enabled, refreshUnreadCountFromStore]);

  return {
    count,
    refreshUnreadCount,
    decrementUnreadCount,
  };
}
