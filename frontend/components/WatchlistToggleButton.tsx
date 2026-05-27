"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchlistStore } from "@/lib/store";

export function WatchlistToggleButton({ ticker }: { ticker: string }) {
  const tickers = useWatchlistStore((state) => state.tickers);
  const toggleTicker = useWatchlistStore((state) => state.toggleTicker);
  const saved = tickers.includes(ticker);

  return (
    <Button
      type="button"
      variant={saved ? "default" : "outline"}
      size="sm"
      onClick={() => toggleTicker(ticker)}
      className={saved ? "gap-2" : "gap-2 text-white/75"}
    >
      <Star size={14} className={saved ? "fill-current" : ""} />
      {saved ? "Saved in Watchlist" : "Add to Watchlist"}
    </Button>
  );
}
