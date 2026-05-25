"use client";

import { useEffect, useMemo, useRef } from "react";
import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import type { OhlcvPoint } from "@/lib/types";

export function Chart({ ticker, data }: { ticker: string; data: OhlcvPoint[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const seriesData = useMemo(
    () =>
      data
        .filter((point) => point.time !== undefined && point.time !== null)
        .map((point) => ({
          time: (typeof point.time === "number" ? point.time : Math.floor(new Date(point.time).getTime() / 1000)) as UTCTimestamp,
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close
        }))
        .filter((point) => Number.isFinite(point.time))
        .sort((a, b) => Number(a.time) - Number(b.time)),
    [data]
  );

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      autoSize: true,
      layout: { background: { color: "#0a0a0a" }, textColor: "#cfcfcf" },
      grid: { vertLines: { color: "rgba(255,255,255,0.05)" }, horzLines: { color: "rgba(255,255,255,0.05)" } },
      crosshair: { mode: 1 },
      timeScale: { borderColor: "rgba(255,255,255,0.1)" },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" }
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00d964",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#00d964",
      wickDownColor: "#ef4444"
    });
    chartRef.current = chart;
    seriesRef.current = series;
    series.setData(seriesData);
    return () => chart.remove();
  }, [seriesData]);

  useEffect(() => {
    seriesRef.current?.setData(seriesData);
  }, [seriesData]);

  return <div ref={ref} aria-label={`${ticker} candlestick chart`} className="h-[360px] w-full rounded-xl border border-white/10 bg-[#0a0a0a]" />;
}
