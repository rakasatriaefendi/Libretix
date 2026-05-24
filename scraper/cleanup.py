"""
scraper/cleanup.py
Hapus data lama dari Supabase supaya tidak membengkak.
Dijalankan otomatis tiap tanggal 1 via GitHub Actions.

Retention policy:
- stock_prices : simpan 90 hari terakhir (data per menit tidak perlu lama)
- news         : simpan 180 hari terakhir
- predictions  : simpan 30 hari terakhir (prediksi lama tidak relevan)
"""

import os
import logging
from datetime import datetime, timezone, timedelta

from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

RETENTION = {
    "stock_prices": {"column": "timestamp",    "days": 90},
    "news":         {"column": "created_at",   "days": 180},
    "predictions":  {"column": "created_at",   "days": 30},
}


def get_supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def cleanup_table(supabase, table: str, column: str, days: int) -> int:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    try:
        result = (
            supabase.table(table)
            .delete()
            .lt(column, cutoff)
            .execute()
        )
        deleted = len(result.data) if result.data else 0
        log.info(f"  {table}: {deleted} rows deleted (older than {days} days)")
        return deleted
    except Exception as e:
        log.error(f"  {table} cleanup error: {e}")
        return 0


def get_table_count(supabase, table: str) -> int:
    try:
        result = supabase.table(table).select("id", count="exact").execute()
        return result.count or 0
    except Exception:
        return -1


def main():
    log.info("=== Cleanup Start ===")
    supabase = get_supabase()

    # Tampilkan jumlah row sebelum cleanup
    log.info("Row count BEFORE cleanup:")
    for table in RETENTION:
        count = get_table_count(supabase, table)
        log.info(f"  {table}: {count} rows")

    # Jalankan cleanup per tabel
    log.info("Running cleanup...")
    total_deleted = 0
    for table, config in RETENTION.items():
        deleted = cleanup_table(supabase, table, config["column"], config["days"])
        total_deleted += deleted

    # Tampilkan jumlah row setelah cleanup
    log.info("Row count AFTER cleanup:")
    for table in RETENTION:
        count = get_table_count(supabase, table)
        log.info(f"  {table}: {count} rows")

    log.info(f"=== Done. Total {total_deleted} rows deleted ===")


if __name__ == "__main__":
    main()