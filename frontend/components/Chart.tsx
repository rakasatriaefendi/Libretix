"use client";

import { useEffect, useMemo, useRef } from "react";
import { CandlestickSeries, LineSeries, LineStyle, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import type { OhlcvPoint } from "@/lib/types";

type PredictionPoint = {
  predicted_price: number;
  confidence_low: number;
  confidence_high: number;
  prediction_date: string;
};

type ChartPredictionSeries = {
  time: UTCTimestamp;
  value: number;
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

    const toTimestamp = (date: string) => Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000) as UTCTimestamp;

    return predictions
      .map((item) => ({
        time: toTimestamp(item.prediction_date),
        predicted_price: item.predicted_price,
        confidence_low: item.confidence_low,
        confidence_high: item.confidence_high
      }))
      .filter((item) => Number.isFinite(item.time))
      .sort((a, b) => Number(a.time) - Number(b.time));
  }, [predictions]);

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
    predictedSeries.setData([]);
    lowSeries.setData([]);
    highSeries.setData([]);
    return () => chart.remove();
  }, []);

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
        <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-md border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-amber-300 backdrop-blur">
          <span className="text-amber-400">──</span> Prediction (Prophet)
        </div>
      )}
      <div ref={ref} aria-label={`${ticker} candlestick chart`} className="h-[360px] w-full rounded-xl border border-white/10 bg-[#0a0a0a]" />
    </div>
  );
}
