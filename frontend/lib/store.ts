import { create } from "zustand";
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
