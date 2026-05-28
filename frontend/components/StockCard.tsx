"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, resolveDisplayChange } from "@/lib/api";
import type { StockSummary } from "@/lib/types";

export function StockCard({ stock }: { stock: StockSummary }) {
  const { change, changePct, positive } = resolveDisplayChange({
    price: stock.price,
    change: stock.change,
    changePct: stock.change_pct,
    open: stock.open
  });
  return (
    <Link href={`/stock/${encodeURIComponent(stock.ticker)}`}>
      <Card className="transition hover:border-[#00d964]/40 hover:shadow-glow">
        <CardContent className="flex items-start justify-between gap-2 p-2 sm:items-center sm:gap-4 sm:p-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{stock.ticker}</div>
            <div className="hidden text-xs text-[color:var(--text-faint)] sm:block">{stock.market ?? ""}</div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-sm font-semibold">{formatCurrency(stock.price, stock.market, stock.ticker)}</div>
            <div className={positive ? "flex items-center gap-1 text-xs text-emerald-400" : "flex items-center gap-1 text-xs text-rose-400"}>
              {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {changePct.toFixed(2)}%
            </div>
            <div className="text-[11px] text-[color:var(--text-faint)]">{change >= 0 ? "+" : ""}{formatCurrency(change, stock.market, stock.ticker, { showSymbol: false })}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
