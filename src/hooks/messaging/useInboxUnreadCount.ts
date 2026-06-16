import { useCallback, useEffect, useState } from "react";

import { getInboxUnreadCount } from "@/services/messageService";

export function useInboxUnreadCount(enabled = true) {
  const [count, setCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return 0;
    }

    try {
      const response = await getInboxUnreadCount();
      setCount(response.count);
      return response.count;
    } catch {
      return 0;
    }
  }, [enabled]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  return {
    count,
    refreshUnreadCount,
  };
}
