"""
scraper/stocks.py
Scrape harga saham AS, IDX, dan crypto → simpan ke Supabase.
Dijalankan oleh GitHub Actions tiap jam.
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

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

US_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "WMT"]
IDX_TICKERS = ["BBCA.JK", "BBRI.JK", "TLKM.JK", "ASII.JK", "BMRI.JK",
               "GOTO.JK", "BYAN.JK", "UNVR.JK", "ICBP.JK", "EXCL.JK"]
CRYPTO_IDS  = ["bitcoin", "ethereum", "binancecoin", "solana", "ripple"]

CRYPTO_TICKER_MAP = {
    "bitcoin": "BTC-USD",
    "ethereum": "ETH-USD",
    "binancecoin": "BNB-USD",
    "solana": "SOL-USD",
    "ripple": "XRP-USD",
}


def get_supabase():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


# ---------------------------------------------------------------
# Scrape Yahoo Finance — individual per ticker (lebih reliable)
# ---------------------------------------------------------------
def scrape_yfinance(tickers: list[str], market: str) -> list[dict]:
    records = []
    now = datetime.now(timezone.utc)

    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            # fast_info lebih ringan dan jarang diblock
            info = stock.fast_info

            price = getattr(info, "last_price", None)
            if price is None or price == 0:
                log.warning(f"  {ticker}: no price data, skip")
                continue

            record = {
                "ticker":    ticker,
                "price":     round(float(price), 4),
                "open":      round(float(info.open), 4) if hasattr(info, "open") and info.open else None,
                "high":      round(float(info.day_high), 4) if hasattr(info, "day_high") and info.day_high else None,
                "low":       round(float(info.day_low), 4) if hasattr(info, "day_low") and info.day_low else None,
                "volume":    int(info.volume) if hasattr(info, "volume") and info.volume else None,
                "market":    market,
                "timestamp": now.isoformat(),
            }
            records.append(record)
            log.info(f"  {ticker}: {record['price']}")
            time.sleep(1)  # Delay per ticker hindari rate limit

        except Exception as e:
            log.error(f"  {ticker} error: {e}")
            time.sleep(2)  # Delay lebih lama kalau error

    return records


# ---------------------------------------------------------------
# Scrape CoinGecko (Crypto)
# ---------------------------------------------------------------
def scrape_crypto() -> list[dict]:
    records = []
    ids_str = ",".join(CRYPTO_IDS)
    try:
        resp = requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={
                "ids": ids_str,
                "vs_currencies": "usd",
                "include_24hr_vol": "true",
                "include_24hr_change": "true",
                "include_high_24h": "true",
                "include_low_24h": "true",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        now  = datetime.now(timezone.utc)

        for cg_id, info in data.items():
            ticker = CRYPTO_TICKER_MAP.get(cg_id, cg_id.upper())
            record = {
                "ticker":    ticker,
                "price":     info.get("usd"),
                "open":      None,
                "high":      info.get("usd_24h_high"),
                "low":       info.get("usd_24h_low"),
                "volume":    int(info.get("usd_24h_vol") or 0),
                "market":    "CRYPTO",
                "timestamp": now.isoformat(),
            }
            records.append(record)
            log.info(f"  {ticker}: {record['price']}")

    except Exception as e:
        log.error(f"CoinGecko error: {e}")

    return records


# ---------------------------------------------------------------
# Save ke Supabase
# ---------------------------------------------------------------
def save_to_supabase(records: list[dict], supabase) -> None:
    if not records:
        log.warning("  Tidak ada data untuk disimpan")
        return
    try:
        supabase.table("stock_prices").insert(records).execute()
        log.info(f"  Saved {len(records)} records to Supabase")
    except Exception as e:
        log.error(f"Supabase insert error: {e}")


# ---------------------------------------------------------------
# Main
# ---------------------------------------------------------------
def main():
    log.info("=== Stock Scraper Start ===")
    supabase = get_supabase()

    log.info("Scraping US stocks...")
    us_records = scrape_yfinance(US_TICKERS, "US")
    save_to_supabase(us_records, supabase)

    time.sleep(3)

    log.info("Scraping IDX stocks...")
    idx_records = scrape_yfinance(IDX_TICKERS, "IDX")
    save_to_supabase(idx_records, supabase)

    time.sleep(2)

    log.info("Scraping Crypto...")
    crypto_records = scrape_crypto()
    save_to_supabase(crypto_records, supabase)

    total = len(us_records) + len(idx_records) + len(crypto_records)
    log.info(f"=== Done. Total {total} records saved ===")


if __name__ == "__main__":
    main()