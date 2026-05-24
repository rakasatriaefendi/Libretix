"""
scraper/news.py
Scrape berita dari NewsAPI + RSS feeds → simpan ke Supabase.
Phase 1: stub. Diaktifkan di Phase 3.
"""

import os
import logging
import feedparser
import requests
from datetime import datetime, timezone
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger(__name__)

RSS_FEEDS = {
    "CNBC Indonesia": "https://www.cnbcindonesia.com/rss",
    "Bisnis.com":     "https://bisnis.com/rss",
    "Reuters":        "https://feeds.reuters.com/reuters/businessNews",
}


def get_supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def scrape_rss() -> list[dict]:
    records = []
    for source, url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:10]:  # Max 10 artikel per feed
                published = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()

                records.append({
                    "title":        entry.get("title", ""),
                    "url":          entry.get("link", ""),
                    "source":       source,
                    "published_at": published,
                    # Sentiment akan diisi di Phase 3 (ML Service)
                    "sentiment":    "neutral",
                    "sentiment_score": 50,
                    "impact":       "low",
                    "tickers_affected": [],
                })
            log.info(f"  {source}: {len(feed.entries)} articles")
        except Exception as e:
            log.error(f"RSS error {source}: {e}")
    return records


def main():
    log.info("=== News Scraper Start ===")
    supabase = get_supabase()
    records  = scrape_rss()
    if records:
        supabase.table("news").insert(records).execute()
        log.info(f"Saved {len(records)} news items")
    log.info("=== Done ===")


if __name__ == "__main__":
    main()
