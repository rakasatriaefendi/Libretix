"use client";

import { useMemo } from "react";
import { StockCard } from "@/components/StockCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toMarketLabel } from "@/lib/api";
import { useUiStore } from "@/lib/store";
import type { Market, StockSummary } from "@/lib/types";

type MarketSection = {
  market: Market;
  stocks: StockSummary[];
  error?: boolean;
};

export function DashboardClient({ sections }: { sections: MarketSection[] }) {
  const search = useUiStore((state) => state.search);
  const normalizedSearch = search.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    return sections
      .map((section) => {
        if (section.error || !normalizedSearch) return section;
        const stocks = section.stocks.filter((stock) => {
          const ticker = stock.ticker.toLowerCase();
          const name = stock.name?.toLowerCase() ?? "";
          const market = toMarketLabel(section.market).toLowerCase();
          return ticker.includes(normalizedSearch) || name.includes(normalizedSearch) || market.includes(normalizedSearch);
        });
        return { ...section, stocks };
      })
      .filter((section) => section.error || !normalizedSearch || section.stocks.length > 0);
  }, [normalizedSearch, sections]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[color:var(--text-muted)]">Live market snapshot for US, IDX, and crypto.</p>
      </div>

      {filteredSections.length === 0 ? (
        <div className="rounded-xl border border-[color:var(--border-color)] bg-[var(--surface-strong)] p-8 text-center text-sm text-[color:var(--text-muted)]">
          Tidak ada ticker yang cocok dengan pencarian dashboard.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSections.map((section) => (
            <Card key={section.market}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-[0.2em] text-[#00d964]">{toMarketLabel(section.market)}</h2>
                  <span className="text-xs text-[color:var(--text-muted)]">
                    {section.error ? "error" : section.stocks.length} tickers
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {section.error ? (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                    Failed to load {toMarketLabel(section.market)} market data.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {section.stocks.map((stock) => (
                      <StockCard key={stock.ticker} stock={{ ...stock, market: section.market }} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
