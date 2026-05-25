import os
import json
from datetime import datetime, timedelta
from typing import Any, Optional

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


def _cache_get(key: str) -> Any | None:
    redis = get_redis()
    if not redis:
        return None
    try:
        data = redis.get(key)
        return json.loads(data) if data else None
    except Exception:
        return None


def _cache_set(key: str, value: Any, ttl: int = CACHE_TTL) -> None:
    redis = get_redis()
    if not redis:
        return
    try:
        redis.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _with_change(current: dict[str, Any], previous: dict[str, Any] | None = None) -> dict[str, Any]:
    price = _to_float(current.get("price"))
    previous_price = _to_float(previous.get("price")) if previous else None
    open_price = _to_float(current.get("open"))
    basis_price = previous_price if previous_price and previous_price > 0 else open_price

    if price is None or not basis_price or basis_price <= 0:
        return {**current, "change": 0.0, "change_pct": 0.0}

    change = round(price - basis_price, 4)
    change_pct = round((change / basis_price) * 100, 2)
    return {**current, "change": change, "change_pct": change_pct}


# -------------------------------------------------------------------
# GET /stocks/latest — semua saham terbaru dari DB
# -------------------------------------------------------------------
@router.get("/latest", response_model=list[StockResponse])
async def get_latest_stocks(
    market: Optional[str] = Query(None, description="Filter: 'US' atau 'IDX'")
):
    cache_key = f"latest_stocks_v2:{market or 'all'}"
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

    # Keep the two newest rows per ticker so dashboard change can be derived.
    seen: dict[str, list[dict[str, Any]]] = {}
    for row in data:
        ticker = row["ticker"]
        ticker_rows = seen.setdefault(ticker, [])
        if len(ticker_rows) < 2:
            ticker_rows.append(row)

    rows = [
        _with_change(ticker_rows[0], ticker_rows[1] if len(ticker_rows) > 1 else None)
        for ticker_rows in seen.values()
    ]
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

    response = _with_change(current, prev)
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
