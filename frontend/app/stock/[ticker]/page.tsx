import Link from "next/link";
import { Suspense } from "react";
import { Chart } from "@/components/Chart";
import { PredictionBadge, PredictionBadgeSkeleton } from "@/components/PredictionBadge";
import { WatchlistToggleButton } from "@/components/WatchlistToggleButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCompactVolume, formatCurrency, getStockDetail, getStockHistory, resolveDisplayChange } from "@/lib/api";
import type { OhlcvPoint, Period } from "@/lib/types";

const periods: Period[] = ["1d", "5d", "1mo", "3mo", "1y"];
const aggregateVolumePeriods: Period[] = ["1mo", "3mo", "1y"];

function normalizeChartData(rows: OhlcvPoint[]): OhlcvPoint[] {
  return rows
    .map((row) => ({
      time: typeof row.time === "number" ? row.time : Math.floor(new Date(row.time).getTime() / 1000),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume
    }))
    .filter((row) => Number.isFinite(row.time) && row.time > 0)
    .sort((a, b) => Number(a.time) - Number(b.time));
}

function getHistoryPreviousClose(rows: OhlcvPoint[], currentPrice: number) {
  if (rows.length === 0) return null;
  const lastBar = rows.at(-1);
  const previousBar = rows.length > 1 ? rows[rows.length - 2] : null;
  if (!lastBar) return null;
  const matchesLastClose = Math.abs(lastBar.close - currentPrice) < 0.0001;
  if (matchesLastClose && previousBar) return previousBar.close;
  return lastBar.close;
}

async function StockDetailView({ ticker, period }: { ticker: string; period: Period }) {
  const [detail, history] = await Promise.all([getStockDetail(ticker), getStockHistory(ticker, period)]);
  const chartData = normalizeChartData(history);
  const firstBar = chartData[0];
  const lastBar = chartData.at(-1);
  const historyPreviousClose = getHistoryPreviousClose(chartData, detail.price);
  const statOpen = firstBar?.open ?? null;
  const statHigh = chartData.length > 0 ? Math.max(...chartData.map((bar) => bar.high)) : null;
  const statLow = chartData.length > 0 ? Math.min(...chartData.map((bar) => bar.low)) : null;
  const statVolume = aggregateVolumePeriods.includes(period)
    ? chartData.reduce((total, bar) => total + Number(bar.volume ?? 0), 0)
    : lastBar?.volume ?? null;
  const { change, changePct, positive } = resolveDisplayChange({
    price: detail.price,
    change: detail.change,
    changePct: detail.change_pct,
    previousClose: detail.previous_close ?? historyPreviousClose,
    open: detail.open
  });
  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="inline-flex">
        <Button variant="ghost" size="sm" className="gap-1 text-white/50 hover:text-white">
          {"<-"} Back to Dashboard
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{detail.ticker}</h1>
                <Badge className="border-[#00d964]/30 text-[#00d964]">{period}</Badge>
              </div>
              <p className="text-sm text-white/45">{detail.name ?? "Market detail"}</p>
              <div className="mt-3">
                <WatchlistToggleButton ticker={detail.ticker} />
              </div>
            </div>
            <div className={positive ? "text-right text-emerald-400" : "text-right text-rose-400"}>
              <div className="text-3xl font-semibold">{formatCurrency(detail.price, detail.market, ticker)}</div>
              <div className="text-sm">
                {change >= 0 ? "+" : ""}
                {formatCurrency(change, detail.market, ticker, { showSymbol: false })} ({changePct.toFixed(2)}%)
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            {periods.map((value) => (
              <Button key={value} asChild variant={value === period ? "default" : "outline"} size="sm">
                <Link href={`/stock/${encodeURIComponent(ticker)}?period=${value}`}>{value}</Link>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Chart ticker={ticker} data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold tracking-[0.2em] text-[#00d964]">STATS</h2>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["Open", statOpen],
            ["High", statHigh],
            ["Low", statLow],
            ["Volume", statVolume]
          ] as [string, number | null | undefined][]).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/45">{label}</div>
              <div className="mt-1 text-sm font-medium">
                {label === "Volume" ? formatCompactVolume(value) : value !== null && value !== undefined ? formatCurrency(value, detail.market, ticker) : "-"}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Suspense fallback={<PredictionBadgeSkeleton />}>
        <PredictionBadge ticker={ticker} market={detail.market ?? "US"} />
      </Suspense>
    </div>
  );
}

export default async function StockPage({
  params,
  searchParams
}: {
  params: { ticker: string };
  searchParams?: { period?: Period };
}) {
  const { ticker } = params;
  const period = searchParams?.period ?? "1mo";
  return <StockDetailView ticker={ticker} period={period} />;
}
