import { create } from "zustand";

import { getAlertsUnreadCount } from "@/services/alertService";

interface AlertsUnreadCountState {
  count: number;
  refreshUnreadCount: (enabled?: boolean) => Promise<number>;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

export const useAlertsUnreadCountStore = create<AlertsUnreadCountState>((set) => ({
  count: 0,

  refreshUnreadCount: async (enabled = true) => {
    if (!enabled) {
      set({ count: 0 });
      return 0;
    }

    try {
      const response = await getAlertsUnreadCount();
      set({ count: response.count });
      return response.count;
    } catch {
      return 0;
    }
  },

  decrementUnreadCount: () => {
    set((state) => ({ count: Math.max(0, state.count - 1) }));
  },

  resetUnreadCount: () => {
    set({ count: 0 });
  },
}));
