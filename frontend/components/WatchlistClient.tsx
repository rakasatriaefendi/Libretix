"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { useWatchlistActions } from "@/hooks/useWatchlistActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency, resolveDisplayChange, toMarketLabel } from "@/lib/api";
import { useAuthStore, useWatchlistStore } from "@/lib/store";
import type { Market, StockSummary } from "@/lib/types";

type WatchlistStock = StockSummary & { market: Market };

function WatchlistRow({
  stock,
  saved,
  onToggle,
  disabled,
}: {
  stock: WatchlistStock;
  saved: boolean;
  onToggle: (ticker: string) => void;
  disabled?: boolean;
}) {
  const { changePct, positive } = resolveDisplayChange({
    price: stock.price,
    change: stock.change,
    changePct: stock.change_pct,
    open: stock.open
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border-color)] bg-[var(--surface-muted)] p-3">
      <Link href={`/stock/${encodeURIComponent(stock.ticker)}`} className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{stock.ticker}</div>
        <div className="truncate text-xs text-[color:var(--text-secondary)]">{stock.name ?? toMarketLabel(stock.market)}</div>
        <div className="text-[11px] text-[color:var(--text-faint)]">{toMarketLabel(stock.market)}</div>
      </Link>
      <div className="text-right">
        <div className="text-sm font-semibold">{formatCurrency(stock.price, stock.market, stock.ticker)}</div>
        <div className={positive ? "text-xs text-emerald-400" : "text-xs text-rose-400"}>{changePct.toFixed(2)}%</div>
      </div>
      <Button
        type="button"
        size="sm"
        variant={saved ? "ghost" : "outline"}
        onClick={() => onToggle(stock.ticker)}
        disabled={disabled}
        className={saved ? "text-rose-300 hover:text-rose-200" : "text-[color:var(--text-secondary)]"}
      >
        {saved ? <Trash2 size={14} /> : <Plus size={14} />}
      </Button>
    </div>
  );
}

export function WatchlistClient({ stocks }: { stocks: WatchlistStock[] }) {
  const [query, setQuery] = useState("");
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const syncStatus = useWatchlistStore((state) => state.syncStatus);
  const { tickers, pendingTicker, toggleTicker } = useWatchlistActions();

  const stockMap = useMemo(() => new Map(stocks.map((stock) => [stock.ticker, stock])), [stocks]);
  const watchlistStocks = useMemo(
    () => tickers.map((ticker) => stockMap.get(ticker)).filter((stock): stock is WatchlistStock => Boolean(stock)),
    [stockMap, tickers]
  );
  const missingTickers = useMemo(() => tickers.filter((ticker) => !stockMap.has(ticker)), [stockMap, tickers]);

  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    const filtered = !normalizedQuery
      ? stocks
      : stocks.filter((stock) => {
          const market = toMarketLabel(stock.market).toLowerCase();
          const name = stock.name?.toLowerCase() ?? "";
          return (
            stock.ticker.toLowerCase().includes(normalizedQuery) ||
            name.includes(normalizedQuery) ||
            market.includes(normalizedQuery)
          );
        });
    return filtered.slice(0, 18);
  }, [normalizedQuery, stocks]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Watchlist</h1>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">Cari ticker, lalu tambahkan saham atau crypto yang ingin Anda pantau.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-[0.2em] text-[#00d964]">SEARCH MARKET</h2>
            <span className="text-xs text-[color:var(--text-faint)]">{searchResults.length} results</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ticker, company, or market..."
            className="w-full rounded-xl border border-[color:var(--border-color)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-faint)] focus:border-[#00d964]/40"
          />
          {searchResults.length === 0 ? (
            <div className="rounded-lg border border-[color:var(--border-color)] bg-[var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
              Tidak ada ticker yang cocok dengan pencarian Anda.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((stock) => (
                <WatchlistRow
                  key={stock.ticker}
                  stock={stock}
                  saved={tickers.includes(stock.ticker)}
                  onToggle={toggleTicker}
                  disabled={pendingTicker === stock.ticker}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-[#00d964]" />
              <h2 className="text-sm font-semibold tracking-[0.2em] text-[#00d964]">MY WATCHLIST</h2>
            </div>
            <span className="text-xs text-[color:var(--text-faint)]">{tickers.length} saved</span>
          </div>
        </CardHeader>
        <CardContent>
          {(authLoading || (user && syncStatus === "syncing")) && (
            <div className="mb-3 rounded-lg border border-[color:var(--border-color)] bg-[var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
              Syncing your watchlist...
            </div>
          )}
          {syncStatus === "error" && (
            <div className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              Watchlist cloud sync failed. Please try signing in again.
            </div>
          )}
          {tickers.length === 0 ? (
            <div className="rounded-lg border border-[color:var(--border-color)] bg-[var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
              Belum ada ticker di watchlist. Tambahkan dari hasil pencarian di atas.
            </div>
          ) : (
            <div className="space-y-3">
              {watchlistStocks.map((stock) => (
                <WatchlistRow
                  key={stock.ticker}
                  stock={stock}
                  saved
                  onToggle={toggleTicker}
                  disabled={pendingTicker === stock.ticker}
                />
              ))}
              {missingTickers.length > 0 && (
                <div className="rounded-lg border border-[color:var(--border-color)] bg-[var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
                  Data terbaru belum tersedia untuk: {missingTickers.join(", ")}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
