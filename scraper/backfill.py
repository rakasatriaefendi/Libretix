"""
scraper/backfill.py
Backfill data historis harian saham AS, IDX, dan Crypto ke Supabase.
Jalankan sekali: python -m scraper.backfill
Data: 2 tahun terakhir dari yfinance + CoinGecko
"""

import os
import time
import logging
from datetime import datetime, timezone

import yfinance as yf
import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    force=True,
)
log = logging.getLogger(__name__)

US_TICKERS  = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "WMT"]
IDX_TICKERS = ["BBCA.JK", "BBRI.JK", "TLKM.JK", "ASII.JK", "BMRI.JK",
               "GOTO.JK", "BYAN.JK", "UNVR.JK", "ICBP.JK", "EXCL.JK"]
CRYPTO_IDS  = ["bitcoin", "ethereum", "binancecoin", "solana", "ripple"]

CRYPTO_TICKER_MAP = {
    "bitcoin":     "BTC-USD",
    "ethereum":    "ETH-USD",
    "binancecoin": "BNB-USD",
    "solana":      "SOL-USD",
    "ripple":      "XRP-USD",
}

PERIOD = "2y"  # 2 tahun data historis


def get_supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def backfill_yfinance(tickers: list[str], market: str, supabase) -> int:
    total = 0
    for ticker in tickers:
        try:
            log.info(f"  Fetching {ticker}...")
            stock = yf.Ticker(ticker)
            hist  = stock.history(period=PERIOD, interval="1d")

            if hist.empty:
                log.warning(f"  {ticker}: no data")
                continue

            records = []
            for idx, row in hist.iterrows():
                # Skip baris dengan price 0 atau NaN
                close = float(row["Close"])
                if not close or close <= 0:
                    continue

                records.append({
                    "ticker":    ticker,
                    "price":     round(close, 4),
                    "open":      round(float(row["Open"]), 4) if row["Open"] else None,
                    "high":      round(float(row["High"]), 4) if row["High"] else None,
                    "low":       round(float(row["Low"]), 4)  if row["Low"]  else None,
                    "volume":    int(row["Volume"]) if row["Volume"] else None,
                    "market":    market,
                    "timestamp": idx.strftime("%Y-%m-%dT00:00:00+00:00"),
                })

            if records:
                # Insert batch — Supabase max 1000 rows per request
                batch_size = 500
                for i in range(0, len(records), batch_size):
                    batch = records[i:i+batch_size]
                    supabase.table("stock_prices").insert(batch).execute()

                log.info(f"  {ticker}: {len(records)} rows inserted")
                total += len(records)

            time.sleep(1)  # Hindari rate limit yfinance

        except Exception as e:
            log.error(f"  {ticker} error: {e}")
            time.sleep(2)

    return total


def backfill_crypto(supabase) -> int:
    """
    CoinGecko free tier tidak support historical daily bulk.
    Pakai yfinance untuk crypto (BTC-USD, ETH-USD, dll) — data tersedia.
    """
    crypto_tickers = list(CRYPTO_TICKER_MAP.values())
    return backfill_yfinance(crypto_tickers, "CRYPTO", supabase)


def main():
    log.info("=== Backfill Historical Data Start ===")
    log.info(f"Period: {PERIOD}")
    supabase = get_supabase()

    total = 0

    log.info("Backfilling US stocks...")
    total += backfill_yfinance(US_TICKERS, "US", supabase)
    time.sleep(3)

    log.info("Backfilling IDX stocks...")
    total += backfill_yfinance(IDX_TICKERS, "IDX", supabase)
    time.sleep(3)

    log.info("Backfilling Crypto...")
    total += backfill_crypto(supabase)

    log.info(f"=== Done. Total {total} rows inserted ===")
    log.info("Tabel stock_prices sekarang punya data historis harian 2 tahun.")
    log.info("Prophet model siap ditraining.")


if __name__ == "__main__":
    main()