"""
scraper/news.py
Scrape berita dari RSS feeds + NewsAPI → sentiment analysis → simpan ke Supabase.
Phase 3: tambah NewsAPI + Gemini sentiment analyzer.
"""

import os
import sys
import logging
import feedparser
import requests
from datetime import datetime, timezone
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    force=True,
)
log = logging.getLogger(__name__)

# Import analyzer — handle kalau dijalankan dari root atau dari folder scraper
try:
    from ml_service.sentiment.analyzer import analyze_batch
except ImportError:
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
        from ml_service.sentiment.analyzer import analyze_batch
    except ImportError:
        log.warning("Analyzer tidak tersedia, sentiment akan neutral semua")
        analyze_batch = None

RSS_FEEDS = {
    "Yahoo Finance":  "https://finance.yahoo.com/rss/topstories",
    "MarketWatch":    "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    "Seeking Alpha":  "https://seekingalpha.com/feed.xml",
    "Investing.com":  "https://www.investing.com/rss/news.rss",
    "Katadata":       "https://katadata.co.id/rss",
}

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
NEWS_API_URL = "https://newsapi.org/v2/top-headlines"


def get_supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def scrape_rss() -> list[dict]:
    records = []
    for source, url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            count = 0
            for entry in feed.entries[:10]:
                published = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()

                title = entry.get("title", "").strip()
                if not title:
                    continue

                records.append({
                    "title":       title,
                    "url":         entry.get("link", ""),
                    "source":      source,
                    "published_at": published,
                    "content":     entry.get("summary", ""),
                })
                count += 1

            log.info(f"  {source}: {count} articles")
        except Exception as e:
            log.error(f"  RSS error {source}: {e}")

    return records


def scrape_newsapi() -> list[dict]:
    """Scrape dari NewsAPI — max 100 req/hari di free tier."""
    if not NEWS_API_KEY:
        log.info("  NewsAPI key tidak ada, skip")
        return []

    records = []
    try:
        resp = requests.get(
            NEWS_API_URL,
            params={
                "category": "business",
                "language": "en",
                "pageSize": 20,
                "apiKey": NEWS_API_KEY,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        for article in data.get("articles", []):
            title = (article.get("title") or "").strip()
            if not title or title == "[Removed]":
                continue

            published = None
            if article.get("publishedAt"):
                try:
                    published = datetime.fromisoformat(
                        article["publishedAt"].replace("Z", "+00:00")
                    ).isoformat()
                except Exception:
                    pass

            records.append({
                "title":        title,
                "url":          article.get("url", ""),
                "source":       article.get("source", {}).get("name", "NewsAPI"),
                "published_at": published,
                "content":      article.get("description", ""),
            })

        log.info(f"  NewsAPI: {len(records)} articles")
    except Exception as e:
        log.error(f"  NewsAPI error: {e}")

    return records


def deduplicate(records: list[dict]) -> list[dict]:
    """Hapus duplikat berdasarkan URL."""
    seen = set()
    unique = []
    for r in records:
        url = r.get("url", "")
        if url and url not in seen:
            seen.add(url)
            unique.append(r)
    return unique


def apply_sentiment(records: list[dict]) -> list[dict]:
    """Jalankan sentiment analysis, fallback ke neutral kalau gagal."""
    if analyze_batch:
        to_analyze = records[:20]
        rest = records[20:]
        log.info(f"Running sentiment analysis on {len(to_analyze)} articles...")
        try:
            analyzed = analyze_batch(to_analyze)
            neutral_rest = [
                {**r, "sentiment": "neutral", "sentiment_score": 50,
                 "impact": "low", "category": "other",
                 "summary_en": "", "summary_id": "", "tickers_affected": []}
                for r in rest
            ]
            return analyzed + neutral_rest
        except Exception as e:
            log.error(f"Sentiment analysis error: {e}")

    return [
        {**r, "sentiment": "neutral", "sentiment_score": 50,
         "impact": "low", "category": "other",
         "summary_en": "", "summary_id": "", "tickers_affected": []}
        for r in records
    ]


def prepare_for_db(records: list[dict]) -> list[dict]:
    """Bersihkan field yang tidak ada di schema DB."""
    db_fields = {
        "title", "url", "source", "published_at",
        "sentiment", "sentiment_score", "impact",
        "summary_en", "summary_id", "tickers_affected",
    }
    return [
        {k: v for k, v in r.items() if k in db_fields}
        for r in records
    ]


def main():
    log.info("=== News Scraper Phase 3 Start ===")
    supabase = get_supabase()

    # Scrape semua sumber
    log.info("Scraping RSS feeds...")
    rss_records = scrape_rss()

    log.info("Scraping NewsAPI...")
    api_records = scrape_newsapi()

    all_records = deduplicate(rss_records + api_records)
    log.info(f"Total unique articles: {len(all_records)}")

    if not all_records:
        log.warning("Tidak ada artikel, stop.")
        return

    # Sentiment analysis
    analyzed = apply_sentiment(all_records)

    # Simpan ke DB
    db_records = prepare_for_db(analyzed)
    try:
        supabase.table("news").insert(db_records).execute()
        log.info(f"Saved {len(db_records)} news items to Supabase")
    except Exception as e:
        log.error(f"Supabase insert error: {e}")

    log.info("=== Done ===")


if __name__ == "__main__":
    main()
