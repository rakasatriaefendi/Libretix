import type {
  HistoryResponse,
  LatestResponse,
  Market,
  OhlcvPoint,
  Period,
  StockDetail,
  StockPrediction,
  StockSummary,
  WatchlistItem
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function normalizeApiBaseUrl(value: string) {
  const parsed = new URL(value);
  const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (!isLocalhost && parsed.protocol === "http:") {
    parsed.protocol = "https:";
  }
  return parsed.toString();
}

function getApiUrl(path: string) {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const base = normalizeApiBaseUrl(API_URL);
  const [pathname, search] = path.split("?");
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const fullPath = search ? `${normalizedPath}?${search}` : normalizedPath;
  return new URL(fullPath, base).toString();
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(getApiUrl(path), { cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}

async function authorizedRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function normalizeStock(raw: StockSummary & { symbol?: string; price?: number; change_pct?: number; changePercent?: number }): StockSummary {
  const open = Number(raw.open ?? 0);
  const price = Number(raw.price ?? 0);
  const derivedChange = open > 0 ? price - open : 0;
  const derivedChangePct = open > 0 ? (derivedChange / open) * 100 : 0;
  const apiChange = Number(raw.change);
  const apiChangePct = Number(raw.change_pct ?? raw.changePercent);
  const hasApiChange = Number.isFinite(apiChange) && Number.isFinite(apiChangePct);
  const apiLooksLikeStaleZero = hasApiChange && apiChange === 0 && apiChangePct === 0 && open > 0 && price !== open;
  const change = hasApiChange && !apiLooksLikeStaleZero ? apiChange : derivedChange;
  const changePct = hasApiChange && !apiLooksLikeStaleZero ? apiChangePct : derivedChangePct;
  return {
    ticker: raw.ticker ?? raw.symbol ?? "",
    price,
    open: Number(raw.open ?? 0),
    high: Number(raw.high ?? 0),
    low: Number(raw.low ?? 0),
    volume: raw.volume ?? null,
    change,
    change_pct: changePct,
    market: raw.market
  };
}

function unwrapStocks(payload: LatestResponse | StockSummary[] | unknown): StockSummary[] {
  const list = Array.isArray(payload)
    ? payload
    : (payload as LatestResponse).data ?? (payload as LatestResponse).results ?? (payload as LatestResponse).stocks ?? [];
  return list.map((item) => normalizeStock(item as StockSummary));
}

function unwrapHistory(payload: HistoryResponse | OhlcvPoint[] | unknown): OhlcvPoint[] {
  const list = Array.isArray(payload)
    ? payload
    : (payload as HistoryResponse).data ?? (payload as HistoryResponse).results ?? (payload as HistoryResponse).history ?? (payload as HistoryResponse).prices ?? [];
  return list
    .map((item) => {
      const raw = item as OhlcvPoint & { date?: string | number };
      const timeValue = raw.time ?? raw.date;
      return {
        time:
          typeof timeValue === "number"
            ? timeValue
            : typeof timeValue === "string"
              ? Math.floor(new Date(timeValue).getTime() / 1000)
              : 0,
        open: Number(raw.open),
        high: Number(raw.high),
        low: Number(raw.low),
        close: Number(raw.close),
        volume: Number(raw.volume ?? 0)
      };
    })
    .filter((point) => Number.isFinite(point.time) && point.time > 0)
    .sort((a, b) => Number(a.time) - Number(b.time));
}

export async function getLatestStocks(market: Market): Promise<StockSummary[]> {
  return unwrapStocks(await request<LatestResponse>(`/stocks/latest?market=${market}`));
}

export async function getStockDetail(ticker: string): Promise<StockDetail> {
  const payload = await request<StockDetail & { symbol?: string }>(`/stocks/${encodeURIComponent(ticker)}`);
  return { ...payload, ticker: payload.ticker ?? payload.symbol ?? ticker };
}

export async function getStockHistory(ticker: string, period: Period): Promise<OhlcvPoint[]> {
  return unwrapHistory(await request<HistoryResponse>(`/stocks/${encodeURIComponent(ticker)}/history?period=${period}`));
}

function isFuturePredictionDate(value: string) {
  return value > new Date().toISOString().slice(0, 10);
}

export async function getStockPredictions(ticker: string): Promise<StockPrediction[]> {
  try {
    const payload = await request<StockPrediction[]>(`/stocks/${encodeURIComponent(ticker)}/predict`);
    return payload.filter((row) => isFuturePredictionDate(row.prediction_date));
  } catch {
    return [];
  }
}

export async function getWatchlist(token: string): Promise<WatchlistItem[]> {
  return authorizedRequest<WatchlistItem[]>("/watchlist/", token);
}

export async function addWatchlistTicker(token: string, ticker: string): Promise<WatchlistItem> {
  return authorizedRequest<WatchlistItem>("/watchlist/", token, {
    method: "POST",
    body: JSON.stringify({ ticker })
  });
}

export async function removeWatchlistTicker(token: string, ticker: string): Promise<void> {
  await authorizedRequest<void>(`/watchlist/${encodeURIComponent(ticker)}/`, token, {
    method: "DELETE"
  });
}

export function toMarketLabel(market: Market) {
  return market === "CRYPTO" ? "Crypto" : market;
}

export function inferCurrency(market?: Market, ticker?: string) {
  if (market === "IDX" || ticker?.endsWith(".JK")) return "IDR";
  return "$";
}

export function formatCurrency(value: number, market?: Market, ticker?: string, options?: { showSymbol?: boolean }) {
  const currency = inferCurrency(market, ticker);
  const showSymbol = options?.showSymbol ?? true;
  const formatted =
    currency === "IDR"
      ? new Intl.NumberFormat("id-ID", { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(value)
      : new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  if (!showSymbol) return formatted;
  return currency === "IDR" ? `IDR ${formatted}` : `$${formatted}`;
}

export function resolveDisplayChange({
  price,
  change,
  changePct,
  previousClose,
  open
}: {
  price: number;
  change?: number | null;
  changePct?: number | null;
  previousClose?: number | null;
  open?: number | null;
}) {
  const apiChange = Number(change);
  const apiChangePct = Number(changePct);
  const hasApiChange = Number.isFinite(apiChange) && Number.isFinite(apiChangePct);
  const baseline = previousClose ?? open ?? null;
  const derivedChange = baseline && baseline > 0 ? price - baseline : 0;
  const derivedChangePct = baseline && baseline > 0 ? (derivedChange / baseline) * 100 : 0;
  const apiLooksStaleZero = hasApiChange && apiChange === 0 && apiChangePct === 0 && Boolean(baseline && baseline > 0 && price !== baseline);
  const resolvedChange = hasApiChange && !apiLooksStaleZero ? apiChange : derivedChange;
  const resolvedChangePct = hasApiChange && !apiLooksStaleZero ? apiChangePct : derivedChangePct;
  return {
    change: resolvedChange,
    changePct: resolvedChangePct,
    positive: resolvedChangePct >= 0
  };
}

export function formatCompactVolume(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}
