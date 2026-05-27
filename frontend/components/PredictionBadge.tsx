import type { Market } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency, getStockDetail } from "@/lib/api";

type PredictionItem = {
  ticker: string;
  predicted_price: number;
  confidence_low: number;
  confidence_high: number;
  prediction_date: string;
  model_used: string;
};

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function PredictionBadgeSkeleton() {
  return (
    <Card className="animate-pulse border-white/10 bg-[#111111]">
      <CardHeader>
        <div className="h-4 w-40 rounded bg-white/10" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-10 rounded-lg bg-black/40" />
        <div className="h-10 rounded-lg bg-black/40" />
        <div className="h-10 rounded-lg bg-black/40" />
      </CardContent>
    </Card>
  );
}

export async function PredictionBadge({ ticker, market }: { ticker: string; market: string }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return <Card className="border-white/10 bg-[#111111]"><CardContent className="p-4 text-sm text-white/45">Prediction not available</CardContent></Card>;

  try {
    const [detailResponse, predictionResponse] = await Promise.all([
      getStockDetail(ticker),
      fetch(new URL(`/stocks/${encodeURIComponent(ticker)}/predict`, apiUrl).toString(), { cache: "no-store" })
    ]);
    const currentPrice = detailResponse.price;
    if (predictionResponse.status === 404) return <UnavailableCard />;
    if (!predictionResponse.ok) throw new Error("Prediction request failed");

    const predictions = (await predictionResponse.json()) as PredictionItem[];
    if (!predictions.length) return <UnavailableCard />;

    return (
      <Card className="border-white/10 bg-[#111111]">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-[0.2em] text-[#00d964]">PREDICTION</h2>
            <span className="text-xs text-white/40">{market}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {predictions.slice(0, 7).map((row) => {
            const bullish = row.predicted_price >= currentPrice;
            return (
              <div key={row.prediction_date} className="grid grid-cols-[1.1fr_1fr_1.2fr] gap-3 rounded-lg border border-white/10 bg-black/40 p-3 text-sm">
                <div className="text-white/70">{formatDateLabel(row.prediction_date)}</div>
                <div className={bullish ? "font-medium text-emerald-400" : "font-medium text-rose-400"}>{formatCurrency(row.predicted_price, market as Market, ticker)}</div>
                <div className="text-right text-white/45">{formatCurrency(row.confidence_low, market as Market, ticker)} - {formatCurrency(row.confidence_high, market as Market, ticker)}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  } catch {
    return <UnavailableCard />;
  }
}

function UnavailableCard() {
  return <Card className="border-white/10 bg-[#111111]"><CardContent className="p-4 text-sm text-white/45">Prediction not available</CardContent></Card>;
}
