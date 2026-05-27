import { DashboardClient } from "@/components/DashboardClient";
import { getLatestStocks } from "@/lib/api";
import type { Market, StockSummary } from "@/lib/types";

const markets: Market[] = ["US", "IDX", "CRYPTO"];
const limits: Record<Market, number> = { US: 10, IDX: 10, CRYPTO: 5 };

export default async function DashboardPage() {
  const results = await Promise.allSettled(markets.map((market) => getLatestStocks(market)));
  const sections = markets.map((market, index) => {
    const result = results[index];
    if (result.status !== "fulfilled") {
      return { market, stocks: [] as StockSummary[], error: true };
    }
    return {
      market,
      stocks: result.value.slice(0, limits[market]).map((stock: StockSummary) => ({ ...stock, market }))
    };
  });

  return <DashboardClient sections={sections} />;
}
