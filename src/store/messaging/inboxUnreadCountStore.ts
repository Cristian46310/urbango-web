import { create } from "zustand";

import { getInboxUnreadCount } from "@/services/messageService";

interface InboxUnreadCountState {
  count: number;
  refreshUnreadCount: (enabled?: boolean) => Promise<number>;
  decrementUnreadCount: (amount?: number) => void;
  resetUnreadCount: () => void;
}

export const useInboxUnreadCountStore = create<InboxUnreadCountState>((set) => ({
  count: 0,

  refreshUnreadCount: async (enabled = true) => {
    if (!enabled) {
      set({ count: 0 });
      return 0;
    }

    try {
      const response = await getInboxUnreadCount();
      set({ count: response.count });
      return response.count;
    } catch {
      return 0;
    }
  },

  decrementUnreadCount: (amount = 1) => {
    set((state) => ({ count: Math.max(0, state.count - amount) }));
  },

  resetUnreadCount: () => {
    set({ count: 0 });
  },
}));
