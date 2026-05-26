"""
ml-service/models/prophet_model.py
Prediksi harga saham menggunakan Facebook Prophet.
Phase 1: skeleton. Diisi penuh di Phase 4.
"""

import os
import logging
from datetime import datetime, timedelta, timezone

import pandas as pd
from prophet import Prophet
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger(__name__)

TICKERS_TO_PREDICT = [
    "AAPL", "MSFT", "BBCA.JK", "BBRI.JK",
    "BTC-USD", "ETH-USD",
]


def get_supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def fetch_history(supabase, ticker: str) -> pd.DataFrame:
    """Ambil 90 hari terakhir dari Supabase."""
    since = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
    result = (
        supabase.table("stock_prices")
        .select("timestamp, price")
        .eq("ticker", ticker)
        .gte("timestamp", since)
        .order("timestamp")
        .execute()
    )
    rows = result.data
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["ds"] = pd.to_datetime(df["timestamp"]).dt.tz_localize(None)
    df["y"]  = df["price"].astype(float)
    return df[["ds", "y"]].dropna()


def run_prophet(df: pd.DataFrame, periods: int = 30) -> pd.DataFrame:
    """Jalankan Prophet, return forecast DataFrame."""
    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=False,
        interval_width=0.8,
    )
    model.fit(df)
    future   = model.make_future_dataframe(periods=periods, freq="D")
    forecast = model.predict(future)
    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods)


def save_predictions(supabase, ticker: str, forecast: pd.DataFrame) -> None:
    records = [
        {
            "ticker":           ticker,
            "predicted_price":  round(float(row["yhat"]), 4),
            "confidence_low":   round(float(row["yhat_lower"]), 4),
            "confidence_high":  round(float(row["yhat_upper"]), 4),
            "prediction_date":  str(row["ds"].date()),
            "model_used":       "prophet-v1",
        }
        for _, row in forecast.iterrows()
        if row["yhat"] > 0  # Sanity check
    ]

    if records:
        # Hapus prediksi lama untuk ticker ini dulu
        supabase.table("predictions").delete().eq("ticker", ticker).execute()
        supabase.table("predictions").insert(records).execute()
        log.info(f"  {ticker}: {len(records)} predictions saved")


def main():
    log.basicConfig(level=logging.INFO)
    log.info("=== Prophet Prediction Start ===")
    supabase = get_supabase()

    for ticker in TICKERS_TO_PREDICT:
        log.info(f"Processing {ticker}...")
        try:
            df = fetch_history(supabase, ticker)
            if len(df) < 30:
                log.warning(f"  {ticker}: data tidak cukup ({len(df)} rows), skip")
                continue

            forecast = run_prophet(df)
            save_predictions(supabase, ticker, forecast)
        except Exception as e:
            log.error(f"  {ticker} error: {e}")

    log.info("=== Done ===")


if __name__ == "__main__":
    main()
