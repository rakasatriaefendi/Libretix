import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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
  tickers: string[];
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;
  toggleTicker: (ticker: string) => void;
  hasTicker: (ticker: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      tickers: [],
      addTicker: (ticker) =>
        set((state) => (state.tickers.includes(ticker) ? state : { tickers: [...state.tickers, ticker] })),
      removeTicker: (ticker) =>
        set((state) => ({ tickers: state.tickers.filter((item) => item !== ticker) })),
      toggleTicker: (ticker) =>
        set((state) => ({
          tickers: state.tickers.includes(ticker)
            ? state.tickers.filter((item) => item !== ticker)
            : [...state.tickers, ticker]
        })),
      hasTicker: (ticker) => get().tickers.includes(ticker)
    }),
    {
      name: "libretix-watchlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tickers: state.tickers })
    }
  )
);
