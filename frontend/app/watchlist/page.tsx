import { WatchlistClient } from "@/components/WatchlistClient";
import { getLatestStocks } from "@/lib/api";
import type { Market, StockSummary } from "@/lib/types";

const markets: Market[] = ["US", "IDX", "CRYPTO"];

export default async function WatchlistPage() {
  const results = await Promise.allSettled(markets.map((market) => getLatestStocks(market)));
  const stocks = markets.flatMap((market, index) => {
    const result = results[index];
    if (result.status !== "fulfilled") return [];
    return result.value.map((stock: StockSummary) => ({ ...stock, market }));
  });

  return <WatchlistClient stocks={stocks} />;
}
