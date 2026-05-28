import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Session, User } from "@supabase/supabase-js";
import type { Period } from "@/lib/types";

interface UiState {
  search: string;
  period: Period;
  setSearch: (search: string) => void;
  setPeriod: (period: Period) => void;
}

export const useUiStore = create<UiState>((set) => ({
  search: "",
  period: "1mo",
  setSearch: (search) => set({ search }),
  setPeriod: (period) => set({ period })
}));

interface WatchlistState {
  localTickers: string[];
  tickers: string[];
  isCloudMode: boolean;
  syncStatus: "idle" | "syncing" | "ready" | "error";
  setLocalTicker: (ticker: string, saved: boolean) => void;
  setCloudTickers: (tickers: string[]) => void;
  setSyncStatus: (status: WatchlistState["syncStatus"]) => void;
  clearLocalTickers: () => void;
  setSignedOutState: () => void;
  hasTicker: (ticker: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      localTickers: [],
      tickers: [],
      isCloudMode: false,
      syncStatus: "idle",
      setLocalTicker: (ticker, saved) =>
        set((state) => {
          const normalizedTicker = ticker.trim().toUpperCase();
          if (!normalizedTicker) return state;

          const nextLocalTickers = saved
            ? state.localTickers.includes(normalizedTicker)
              ? state.localTickers
              : [...state.localTickers, normalizedTicker]
            : state.localTickers.filter((item) => item !== normalizedTicker);

          return {
            localTickers: nextLocalTickers,
            tickers: state.isCloudMode ? state.tickers : nextLocalTickers
          };
        }),
      setCloudTickers: (tickers) =>
        set({
          tickers: [...new Set(tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))],
          isCloudMode: true,
          syncStatus: "ready"
        }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      clearLocalTickers: () => set({ localTickers: [] }),
      setSignedOutState: () =>
        set((state) => ({
          isCloudMode: false,
          syncStatus: "idle",
          tickers: state.localTickers
        })),
      hasTicker: (ticker) => get().tickers.includes(ticker)
    }),
    {
      name: "libretix-watchlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ localTickers: state.localTickers }),
      onRehydrateStorage: () => (state) => {
        if (!state || state.isCloudMode) return;
        state.tickers = state.localTickers;
      }
    }
  )
);

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setAuthState: (params: { user: User | null; session: Session | null; loading?: boolean }) => void;
  setLoading: (loading: boolean) => void;
  clearAuthState: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  setAuthState: ({ user, session, loading = false }) => set({ user, session, loading }),
  setLoading: (loading) => set({ loading }),
  clearAuthState: () => set({ user: null, session: null, loading: false })
}));
