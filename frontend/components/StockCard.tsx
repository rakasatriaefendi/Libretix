"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/api";
import type { StockSummary } from "@/lib/types";

export function StockCard({ stock }: { stock: StockSummary }) {
  const change = Number.isFinite(stock.change) ? stock.change : (stock.price - Number(stock.open ?? stock.price));
  const changePct = Number.isFinite(stock.change_pct) && stock.change_pct !== 0
    ? stock.change_pct
    : Number(stock.open && stock.open > 0 ? ((stock.price - stock.open) / stock.open) * 100 : 0);
  const positive = changePct >= 0;
  return (
    <Link href={`/stock/${encodeURIComponent(stock.ticker)}`}>
      <Card className="transition hover:border-[#00d964]/40 hover:shadow-glow">
        <CardContent className="flex items-center justify-between gap-4 p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{stock.ticker}</div>
            <div className="text-xs text-white/45">{stock.market ?? ""}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{formatCurrency(stock.price, stock.market, stock.ticker)}</div>
            <div className={positive ? "flex items-center gap-1 text-xs text-emerald-400" : "flex items-center gap-1 text-xs text-rose-400"}>
              {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {changePct.toFixed(2)}%
            </div>
            <div className="text-[11px] text-white/35">{change >= 0 ? "+" : ""}{change.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
