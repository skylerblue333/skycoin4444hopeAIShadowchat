/**
 * Shared App State Store (Zustand)
 * Powers BOTH the Legacy Shell and the Unified OS Shell.
 * This is the critical bridge that allows old + new UI to coexist.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OSMode = "discover" | "execute" | "identity";
export type UIShell = "os" | "legacy";

export interface AppState {
  // Shell selection
  shell: UIShell;
  setShell: (shell: UIShell) => void;
  toggleShell: () => void;

  // OS mode (Discover / Execute / Identity)
  mode: OSMode;
  setMode: (mode: OSMode) => void;

  // Overlay states
  chatOverlayOpen: boolean;
  setChatOverlayOpen: (open: boolean) => void;

  actionDrawerOpen: boolean;
  setActionDrawerOpen: (open: boolean) => void;

  profilePanelOpen: boolean;
  setProfilePanelOpen: (open: boolean) => void;

  // Active context
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;

  activeProfileId: string | null;
  setActiveProfileId: (id: string | null) => void;

  // Pending action from chat
  pendingActionText: string;
  setPendingActionText: (text: string) => void;

  // Feed state
  feedFilter: "all" | "following" | "trending" | "ai";
  setFeedFilter: (filter: "all" | "following" | "trending" | "ai") => void;

  // Notification badge
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Shell
      shell: "legacy",
      setShell: (shell) => set({ shell }),
      toggleShell: () => set((s) => ({ shell: s.shell === "os" ? "legacy" : "os" })),

      // OS mode
      mode: "discover",
      setMode: (mode) => set({ mode }),

      // Overlays
      chatOverlayOpen: false,
      setChatOverlayOpen: (open) => set({ chatOverlayOpen: open }),

      actionDrawerOpen: false,
      setActionDrawerOpen: (open) => set({ actionDrawerOpen: open }),

      profilePanelOpen: false,
      setProfilePanelOpen: (open) => set({ profilePanelOpen: open }),

      // Context
      activeChatId: null,
      setActiveChatId: (id) => set({ activeChatId: id }),

      activeProfileId: null,
      setActiveProfileId: (id) => set({ activeProfileId: id }),

      // Pending action
      pendingActionText: "",
      setPendingActionText: (text) => set({ pendingActionText: text }),

      // Feed
      feedFilter: "all",
      setFeedFilter: (filter) => set({ feedFilter: filter }),

      // Notifications
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
      clearUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name: "shadowchat-app-store",
      partialize: (state) => ({
        shell: state.shell,
        mode: state.mode,
        feedFilter: state.feedFilter,
      }),
    }
  )
);
