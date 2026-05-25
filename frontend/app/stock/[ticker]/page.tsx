import Link from "next/link";
import { Chart } from "@/components/Chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getStockDetail, getStockHistory } from "@/lib/api";
import type { OhlcvPoint, Period } from "@/lib/types";

const periods: Period[] = ["1d", "5d", "1mo", "3mo", "1y"];

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

async function StockDetailView({ ticker, period }: { ticker: string; period: Period }) {
  const [detail, history] = await Promise.all([getStockDetail(ticker), getStockHistory(ticker, period)]);
  const chartData = normalizeChartData(history);
  const latestVolume = chartData.at(-1)?.volume ?? detail.volume ?? null;
  const change = detail.change ?? (detail.open && detail.open > 0 ? detail.price - detail.open : 0);
  const changePct = detail.change_pct ?? (detail.open && detail.open > 0 ? ((detail.price - detail.open) / detail.open) * 100 : 0);
  const positive = changePct >= 0;

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
            </div>
            <div className={positive ? "text-right text-emerald-400" : "text-right text-rose-400"}>
              <div className="text-3xl font-semibold">${detail.price.toFixed(2)}</div>
              <div className="text-sm">
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)} ({changePct.toFixed(2)}%)
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
            ["Open", detail.open],
            ["High", detail.high],
            ["Low", detail.low],
            ["Volume", latestVolume]
          ] as [string, number | null | undefined][]).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/45">{label}</div>
              <div className="mt-1 text-sm font-medium">{value ?? "-"}</div>
            </div>
          ))}
        </CardContent>
      </Card>
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
