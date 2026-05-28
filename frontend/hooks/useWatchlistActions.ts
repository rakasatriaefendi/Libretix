"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { addWatchlistTicker, removeWatchlistTicker } from "@/lib/api";
import { useAuthStore, useWatchlistStore } from "@/lib/store";

export function useWatchlistActions() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const authLoading = useAuthStore((state) => state.loading);
  const tickers = useWatchlistStore((state) => state.tickers);
  const hasTicker = useWatchlistStore((state) => state.hasTicker);
  const setLocalTicker = useWatchlistStore((state) => state.setLocalTicker);
  const setCloudTickers = useWatchlistStore((state) => state.setCloudTickers);
  const [pendingTicker, setPendingTicker] = useState<string | null>(null);

  async function toggleTicker(rawTicker: string) {
    const ticker = rawTicker.trim().toUpperCase();
    if (!ticker || authLoading) return;

    const saved = hasTicker(ticker);

    if (!session?.access_token) {
      setLocalTicker(ticker, !saved);
      if (!saved) {
        const currentQuery = typeof window !== "undefined" ? window.location.search.slice(1) : "";
        const redirectTarget = currentQuery ? `${pathname}?${currentQuery}` : pathname;
        router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      }
      return;
    }

    setPendingTicker(ticker);
    try {
      if (saved) {
        await removeWatchlistTicker(session.access_token, ticker);
        setCloudTickers(tickers.filter((item) => item !== ticker));
      } else {
        await addWatchlistTicker(session.access_token, ticker);
        setCloudTickers([...tickers, ticker]);
      }
    } finally {
      setPendingTicker(null);
    }
  }

  return {
    tickers,
    authLoading,
    pendingTicker,
    toggleTicker
  };
}
