import os
import json
from datetime import datetime, timedelta
from typing import Optional

import yfinance as yf
from fastapi import APIRouter, HTTPException, Query
from upstash_redis import Redis

from backend.db.supabase import get_supabase
from backend.models.schemas import StockResponse, StockHistory, Prediction

router = APIRouter(prefix="/stocks", tags=["stocks"])

# Redis cache client (lazy init)
_redis: Redis | None = None

CACHE_TTL = 300  # 5 menit


def get_redis() -> Redis | None:
    global _redis
    if _redis is None:
        url = os.getenv("UPSTASH_REDIS_URL")
        token = os.getenv("UPSTASH_REDIS_TOKEN")
        if url and token:
            _redis = Redis(url=url, token=token)
    return _redis


def _cache_get(key: str) -> dict | None:
    redis = get_redis()
    if not redis:
        return None
    try:
        data = redis.get(key)
        return json.loads(data) if data else None
    except Exception:
        return None


def _cache_set(key: str, value: dict, ttl: int = CACHE_TTL) -> None:
    redis = get_redis()
    if not redis:
        return
    try:
        redis.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


# -------------------------------------------------------------------
# GET /stocks/latest — semua saham terbaru dari DB
# -------------------------------------------------------------------
@router.get("/latest", response_model=list[StockResponse])
async def get_latest_stocks(
    market: Optional[str] = Query(None, description="Filter: 'US' atau 'IDX'")
):
    cache_key = f"latest_stocks:{market or 'all'}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    supabase = get_supabase()
    query = (
        supabase.table("stock_prices")
        .select("*")
        .order("timestamp", desc=True)
    )
    if market:
        query = query.eq("market", market.upper())

    # Ambil 1 data terbaru per ticker (distinct workaround)
    result = query.limit(500).execute()
    data = result.data

    # Deduplicate: ambil yang terbaru per ticker
    seen: dict[str, dict] = {}
    for row in data:
        ticker = row["ticker"]
        if ticker not in seen:
            seen[ticker] = row

    rows = list(seen.values())
    _cache_set(cache_key, rows, ttl=120)
    return rows


# -------------------------------------------------------------------
# GET /stocks/{ticker} — harga terbaru 1 saham
# -------------------------------------------------------------------
@router.get("/{ticker}", response_model=StockResponse)
async def get_stock(ticker: str):
    ticker = ticker.upper()
    cache_key = f"stock:{ticker}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    supabase = get_supabase()
    result = (
        supabase.table("stock_prices")
        .select("*")
        .eq("ticker", ticker)
        .order("timestamp", desc=True)
        .limit(2)
        .execute()
    )

    rows = result.data
    if not rows:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} tidak ditemukan")

    current = rows[0]
    prev = rows[1] if len(rows) > 1 else None

    change = None
    change_pct = None
    if prev and prev["price"]:
        change = round(current["price"] - prev["price"], 4)
        change_pct = round((change / prev["price"]) * 100, 2)

    response = {**current, "change": change, "change_pct": change_pct}
    _cache_set(cache_key, response, ttl=60)
    return response


# -------------------------------------------------------------------
# GET /stocks/{ticker}/history — data historis
# -------------------------------------------------------------------
@router.get("/{ticker}/history", response_model=list[StockHistory])
async def get_stock_history(
    ticker: str,
    period: str = Query("1mo", description="1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y"),
):
    ticker = ticker.upper()
    cache_key = f"history:{ticker}:{period}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No history for {ticker}")

        data = [
            {
                "ticker": ticker,
                "date": str(idx.date()),
                "open": round(row["Open"], 4),
                "high": round(row["High"], 4),
                "low": round(row["Low"], 4),
                "close": round(row["Close"], 4),
                "volume": int(row["Volume"]),
            }
            for idx, row in hist.iterrows()
        ]
        _cache_set(cache_key, data, ttl=3600)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------------
# GET /stocks/{ticker}/predict — prediksi dari tabel predictions
# -------------------------------------------------------------------
@router.get("/{ticker}/predict", response_model=list[Prediction])
async def get_predictions(ticker: str):
    ticker = ticker.upper()
    cache_key = f"predict:{ticker}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    supabase = get_supabase()
    result = (
        supabase.table("predictions")
        .select("*")
        .eq("ticker", ticker)
        .order("prediction_date", desc=False)
        .limit(30)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail=f"No predictions for {ticker}")

    _cache_set(cache_key, result.data, ttl=3600)
    return result.data
