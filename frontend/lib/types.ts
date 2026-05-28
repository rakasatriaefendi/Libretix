export type Market = "US" | "IDX" | "CRYPTO";
export type Period = "1d" | "5d" | "1mo" | "3mo" | "1y";

export interface StockSummary {
  ticker: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number | null;
  change: number;
  change_pct: number;
  market?: Market;
  name?: string;
}

export interface OhlcvPoint {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface StockDetail extends StockSummary {
  previous_close?: number;
  market_cap?: number;
  currency?: string;
}

export interface LatestResponse {
  data?: StockSummary[];
  results?: StockSummary[];
  stocks?: StockSummary[];
}

export interface HistoryResponse {
  data?: OhlcvPoint[];
  results?: OhlcvPoint[];
  history?: OhlcvPoint[];
  prices?: OhlcvPoint[];
}

export interface StockPrediction {
  ticker?: string;
  predicted_price: number;
  confidence_low: number;
  confidence_high: number;
  prediction_date: string;
  model_used?: string;
}

export interface WatchlistItem {
  ticker: string;
  added_at?: string | null;
}

export interface PriceAlert {
  id: string;
  ticker: string;
  target_price: number;
  condition: "above" | "below";
  created_at?: string | null;
  is_triggered?: boolean;
  triggered_at?: string | null;
}
