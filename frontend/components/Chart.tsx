"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  CandlestickSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp
} from "lightweight-charts";
import { useThemeStore } from "@/lib/store";
import type { OhlcvPoint } from "@/lib/types";

type PredictionPoint = {
  predicted_price: number;
  confidence_low: number;
  confidence_high: number;
  prediction_date: string;
};

export function Chart({
  ticker,
  data,
  predictions
}: {
  ticker: string;
  data: OhlcvPoint[];
  predictions?: PredictionPoint[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const predictedSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const confidenceLowRef = useRef<ISeriesApi<"Line"> | null>(null);
  const confidenceHighRef = useRef<ISeriesApi<"Line"> | null>(null);
  const theme = useThemeStore((state) => state.theme);

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

  const predictionSeries = useMemo(() => {
    if (!predictions?.length) return [];

    return predictions
      .map((item) => ({
        time: Math.floor(new Date(`${item.prediction_date}T00:00:00Z`).getTime() / 1000) as UTCTimestamp,
        predicted_price: item.predicted_price,
        confidence_low: item.confidence_low,
        confidence_high: item.confidence_high
      }))
      .filter((item) => Number.isFinite(item.time))
      .sort((a, b) => Number(a.time) - Number(b.time));
  }, [predictions]);

  useEffect(() => {
    if (!ref.current) return;

    const styles = getComputedStyle(document.documentElement);
    const chart = createChart(ref.current, {
      autoSize: true,
      layout: {
        background: { color: styles.getPropertyValue("--chart-bg").trim() || "#0a0a0a" },
        textColor: styles.getPropertyValue("--text-secondary").trim() || "#cfcfcf"
      },
      grid: {
        vertLines: { color: styles.getPropertyValue("--chart-grid").trim() || "rgba(255,255,255,0.05)" },
        horzLines: { color: styles.getPropertyValue("--chart-grid").trim() || "rgba(255,255,255,0.05)" }
      },
      crosshair: { mode: 1 },
      timeScale: { borderColor: styles.getPropertyValue("--chart-border").trim() || "rgba(255,255,255,0.1)" },
      rightPriceScale: { borderColor: styles.getPropertyValue("--chart-border").trim() || "rgba(255,255,255,0.1)" }
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00d964",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#00d964",
      wickDownColor: "#ef4444"
    });
    const predictedSeries = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: true
    });
    const lowSeries = chart.addSeries(LineSeries, {
      color: "rgba(245,158,11,0.2)",
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false
    });
    const highSeries = chart.addSeries(LineSeries, {
      color: "rgba(245,158,11,0.2)",
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false
    });

    chartRef.current = chart;
    seriesRef.current = series;
    predictedSeriesRef.current = predictedSeries;
    confidenceLowRef.current = lowSeries;
    confidenceHighRef.current = highSeries;

    series.setData(seriesData);
    predictedSeries.setData(predictionSeries.map((item) => ({ time: item.time, value: item.predicted_price })));
    lowSeries.setData(predictionSeries.map((item) => ({ time: item.time, value: item.confidence_low })));
    highSeries.setData(predictionSeries.map((item) => ({ time: item.time, value: item.confidence_high })));

    return () => chart.remove();
  }, [predictionSeries, seriesData, theme]);

  useEffect(() => {
    seriesRef.current?.setData(seriesData);
  }, [seriesData]);

  useEffect(() => {
    predictedSeriesRef.current?.setData(predictionSeries.map((item) => ({ time: item.time, value: item.predicted_price })));
    confidenceLowRef.current?.setData(predictionSeries.map((item) => ({ time: item.time, value: item.confidence_low })));
    confidenceHighRef.current?.setData(predictionSeries.map((item) => ({ time: item.time, value: item.confidence_high })));
  }, [predictionSeries]);

  return (
    <div className="relative">
      {predictionSeries.length > 0 && (
        <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-md border border-[color:var(--border-color)] bg-[var(--surface-input)] px-2.5 py-1 text-[11px] font-medium text-amber-500 backdrop-blur">
          <span className="text-amber-500">--</span> Prediction (Prophet)
        </div>
      )}
      <div ref={ref} aria-label={`${ticker} candlestick chart`} className="h-[360px] w-full rounded-xl border border-[color:var(--border-color)] bg-[var(--chart-bg)]" />
    </div>
  );
}
