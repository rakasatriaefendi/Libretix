import { getLatestStocks, toMarketLabel } from "@/lib/api";
import type { Market, StockSummary } from "@/lib/types";
import { StockCard } from "@/components/StockCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const markets: Market[] = ["US", "IDX", "CRYPTO"];
const limits: Record<Market, number> = { US: 10, IDX: 10, CRYPTO: 5 };

export default async function DashboardPage() {
  const results = await Promise.allSettled(markets.map((market) => getLatestStocks(market)));
  const marketData = markets.map((market, index) => ({ market, result: results[index] }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-white/45">Live market snapshot for US, IDX, and crypto.</p>
      </div>
      <div className="space-y-4">
        {marketData.map(({ market, result }) => (
          <Card key={market}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-[0.2em] text-[#00d964]">{toMarketLabel(market)}</h2>
                <span className="text-xs text-white/45">{result.status === "fulfilled" ? result.value.length : "error"} tickers</span>
              </div>
            </CardHeader>
            <CardContent>
              {result.status === "fulfilled" ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {result.value.slice(0, limits[market]).map((stock: StockSummary) => (
                    <StockCard key={stock.ticker} stock={{ ...stock, market }} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                  Failed to load {toMarketLabel(market)} market data.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
