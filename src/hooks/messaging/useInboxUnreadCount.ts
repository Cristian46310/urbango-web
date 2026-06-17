import { useCallback, useEffect } from "react";

import { useInboxUnreadCountStore } from "@/store/messaging/inboxUnreadCountStore";

export function useInboxUnreadCount(enabled = true) {
  const count = useInboxUnreadCountStore((state) => state.count);
  const refreshUnreadCountFromStore = useInboxUnreadCountStore((state) => state.refreshUnreadCount);
  const decrementUnreadCount = useInboxUnreadCountStore((state) => state.decrementUnreadCount);

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
