"""
ml_service/models/prophet_model.py
Prediksi harga saham menggunakan Facebook Prophet.
Dijalankan tiap hari jam 01:00 UTC via GitHub Actions.
"""

import os
import logging
from datetime import datetime, timedelta, timezone

import pandas as pd
from prophet import Prophet
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    force=True,
)
log = logging.getLogger(__name__)

# Ticker yang diprediksi — subset dari semua ticker
TICKERS_TO_PREDICT = {
    "US":     ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA"],
    "IDX":    ["BBCA.JK", "BBRI.JK", "TLKM.JK", "BMRI.JK", "ASII.JK"],
    "CRYPTO": ["BTC-USD", "ETH-USD", "BNB-USD"],
}

PREDICT_DAYS    = 30   # Prediksi 30 hari ke depan
MIN_DATA_POINTS = 60   # Minimal 60 hari data untuk training
MODEL_VERSION   = "prophet-v1"


def get_supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def fetch_history(supabase, ticker: str) -> pd.DataFrame:
    """Ambil data historis harian dari Supabase, sorted ascending."""
    try:
        # Ambil max 730 hari (2 tahun) data harian
        since = (datetime.now(timezone.utc) - timedelta(days=730)).isoformat()
        result = (
            supabase.table("stock_prices")
            .select("timestamp, price")
            .eq("ticker", ticker)
            .gte("timestamp", since)
            .order("timestamp", desc=False)
            .limit(730)
            .execute()
        )

        rows = result.data
        if not rows:
            return pd.DataFrame()

        df = pd.DataFrame(rows)
        df["ds"] = pd.to_datetime(df["timestamp"], format='ISO8601').dt.tz_localize(None).dt.normalize()
        df["y"]  = df["price"].astype(float)

        # Deduplicate per hari — ambil nilai terakhir per tanggal
        df = df.groupby("ds")["y"].last().reset_index()
        df = df.sort_values("ds").reset_index(drop=True)

        return df[["ds", "y"]].dropna()

    except Exception as e:
        log.error(f"  fetch_history error for {ticker}: {e}")
        return pd.DataFrame()


def run_prophet(df: pd.DataFrame, ticker: str, market: str) -> pd.DataFrame | None:
    """Training Prophet dan return forecast DataFrame."""
    try:
        # Config berbeda per market
        if market == "CRYPTO":
            # Crypto tidak punya weekly seasonality yang jelas
            model = Prophet(
                daily_seasonality=False,
                weekly_seasonality=False,
                yearly_seasonality=True,
                interval_width=0.8,
                changepoint_prior_scale=0.1,
            )
        elif market == "IDX":
            model = Prophet(
                daily_seasonality=False,
                weekly_seasonality=True,
                yearly_seasonality=True,
                interval_width=0.8,
                changepoint_prior_scale=0.05,
            )
        else:  # US stocks
            model = Prophet(
                daily_seasonality=False,
                weekly_seasonality=True,
                yearly_seasonality=True,
                interval_width=0.8,
                changepoint_prior_scale=0.05,
            )

        model.fit(df)
        future   = model.make_future_dataframe(periods=PREDICT_DAYS, freq="D")
        forecast = model.predict(future)

        # Ambil hanya future predictions (bukan historical fit)
        last_date = df["ds"].max()
        future_fc = forecast[forecast["ds"] > last_date].copy()

        return future_fc[["ds", "yhat", "yhat_lower", "yhat_upper"]]

    except Exception as e:
        log.error(f"  Prophet error for {ticker}: {e}")
        return None


def save_predictions(supabase, ticker: str, forecast: pd.DataFrame) -> int:
    """Simpan prediksi ke tabel predictions, replace yang lama."""
    try:
        records = []
        for _, row in forecast.iterrows():
            predicted = round(float(row["yhat"]), 4)
            low       = round(float(row["yhat_lower"]), 4)
            high      = round(float(row["yhat_upper"]), 4)

            # Sanity check — harga tidak boleh negatif
            if predicted <= 0:
                continue

            records.append({
                "ticker":           ticker,
                "predicted_price":  predicted,
                "confidence_low":   max(0, low),
                "confidence_high":  high,
                "prediction_date":  str(row["ds"].date()),
                "model_used":       MODEL_VERSION,
            })

        if not records:
            log.warning(f"  {ticker}: no valid predictions")
            return 0

        # Hapus prediksi lama untuk ticker ini
        supabase.table("predictions").delete().eq("ticker", ticker).execute()

        # Insert prediksi baru
        supabase.table("predictions").insert(records).execute()
        log.info(f"  {ticker}: {len(records)} predictions saved")
        return len(records)

    except Exception as e:
        log.error(f"  save_predictions error for {ticker}: {e}")
        return 0


def process_ticker(supabase, ticker: str, market: str) -> bool:
    """Process satu ticker: fetch → train → predict → save."""
    log.info(f"Processing {ticker} ({market})...")

    df = fetch_history(supabase, ticker)

    if len(df) < MIN_DATA_POINTS:
        log.warning(f"  {ticker}: data tidak cukup ({len(df)} rows, min {MIN_DATA_POINTS}), skip")
        return False

    log.info(f"  {ticker}: {len(df)} data points, training Prophet...")
    forecast = run_prophet(df, ticker, market)

    if forecast is None or forecast.empty:
        log.warning(f"  {ticker}: forecast kosong, skip")
        return False

    saved = save_predictions(supabase, ticker, forecast)
    return saved > 0


def main():
    log.info("=== Prophet Prediction Start ===")
    supabase = get_supabase()

    total_success = 0
    total_failed  = 0

    for market, tickers in TICKERS_TO_PREDICT.items():
        log.info(f"\n--- {market} ---")
        for ticker in tickers:
            success = process_ticker(supabase, ticker, market)
            if success:
                total_success += 1
            else:
                total_failed += 1

    log.info(f"\n=== Done. {total_success} success, {total_failed} failed ===")


if __name__ == "__main__":
    main()