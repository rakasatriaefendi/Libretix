"use client";

import { Star } from "lucide-react";
import { useWatchlistActions } from "@/hooks/useWatchlistActions";
import { Button } from "@/components/ui/button";

export function WatchlistToggleButton({ ticker }: { ticker: string }) {
  const { tickers, authLoading, pendingTicker, toggleTicker } = useWatchlistActions();
  const saved = tickers.includes(ticker);
  const disabled = authLoading || pendingTicker === ticker;

  return (
    <Button
      type="button"
      variant={saved ? "default" : "outline"}
      size="sm"
      onClick={() => toggleTicker(ticker)}
      disabled={disabled}
      className={saved ? "gap-2" : "gap-2 text-[color:var(--text-secondary)]"}
    >
      <Star size={14} className={saved ? "fill-current" : ""} />
      {disabled ? "Saving..." : saved ? "Saved in Watchlist" : "Add to Watchlist"}
    </Button>
  );
}
