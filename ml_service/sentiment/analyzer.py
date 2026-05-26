"""
ml-service/sentiment/analyzer.py
Analisis sentiment berita keuangan menggunakan Gemini API.
Gratis: 1500 req/hari (Gemini 1.5 Flash).
"""

import time
import os
import json
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

# Ticker lists untuk deteksi otomatis
US_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "WMT"]
IDX_TICKERS = ["BBCA", "BBRI", "TLKM", "ASII", "BMRI", "GOTO", "BYAN", "UNVR", "ICBP", "EXCL"]
CRYPTO_TICKERS = ["BTC", "ETH", "BNB", "SOL", "XRP", "BITCOIN", "ETHEREUM"]

PROMPT_TEMPLATE = """Kamu adalah financial news analyst. Analisis artikel berita berikut.

Return HANYA JSON valid, tidak ada teks lain, tidak ada markdown:

{{
  "sentiment": "positive|negative|neutral",
  "score": <angka 0-100, 0=sangat negatif, 50=netral, 100=sangat positif>,
  "impact": "high|medium|low",
  "category": "earnings|merger|macro|sector|crypto|other",
  "summary_en": "<ringkasan 1-2 kalimat bahasa Inggris>",
  "summary_id": "<ringkasan 1-2 kalimat bahasa Indonesia>",
  "tickers_affected": [<list ticker yang disebutkan, format: "AAPL", "BBCA.JK", "BTC-USD">]
}}

Artikel:
Title: {title}
Content: {content}"""


def detect_tickers_fallback(title: str) -> list[str]:
    """Fallback: deteksi ticker dari title kalau Gemini gagal."""
    found = []
    title_upper = title.upper()
    for t in US_TICKERS:
        if t in title_upper:
            found.append(t)
    for t in IDX_TICKERS:
        if t in title_upper:
            found.append(f"{t}.JK")
    for t in CRYPTO_TICKERS:
        if t in title_upper:
            ticker_map = {
                "BITCOIN": "BTC-USD", "ETHEREUM": "ETH-USD",
                "BTC": "BTC-USD", "ETH": "ETH-USD",
                "BNB": "BNB-USD", "SOL": "SOL-USD", "XRP": "XRP-USD",
            }
            found.append(ticker_map.get(t, f"{t}-USD"))
    return list(set(found))


def analyze(title: str, content: str = "") -> dict:
    """
    Analisis sentiment satu artikel.
    Return dict dengan keys: sentiment, score, impact, category,
                             summary_en, summary_id, tickers_affected
    """
    if not GEMINI_API_KEY:
        log.warning("GEMINI_API_KEY tidak tersedia, pakai fallback neutral")
        return _fallback(title)

    # Truncate content kalau terlalu panjang
    content_truncated = (content or title)[:1000]

    prompt = PROMPT_TEMPLATE.format(
        title=title,
        content=content_truncated,
    )

    try:
        resp = requests.post(
            GEMINI_URL,
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 300,
                },
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        # Extract text dari response
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

        # Bersihkan markdown kalau ada
        text = text.replace("```json", "").replace("```", "").strip()

        result = json.loads(text)

        # Validasi dan normalisasi
        sentiment = result.get("sentiment", "neutral").lower()
        if sentiment not in ("positive", "negative", "neutral"):
            sentiment = "neutral"

        score = int(result.get("score", 50))
        score = max(0, min(100, score))

        impact = result.get("impact", "low").lower()
        if impact not in ("high", "medium", "low"):
            impact = "low"

        tickers = result.get("tickers_affected", [])
        if not isinstance(tickers, list):
            tickers = []

        return {
            "sentiment":        sentiment,
            "sentiment_score":  score,
            "impact":           impact,
            "category":         result.get("category", "other"),
            "summary_en":       result.get("summary_en", ""),
            "summary_id":       result.get("summary_id", ""),
            "tickers_affected": tickers,
        }

    except Exception as e:
        log.error(f"Gemini API error: {e}")
        return _fallback(title)


def _fallback(title: str) -> dict:
    """Fallback kalau Gemini tidak tersedia."""
    return {
        "sentiment":        "neutral",
        "sentiment_score":  50,
        "impact":           "low",
        "category":         "other",
        "summary_en":       "",
        "summary_id":       "",
        "tickers_affected": detect_tickers_fallback(title),
    }


def analyze_batch(articles: list[dict]) -> list[dict]:
    """
    Analisis batch artikel.
    Input: list of {title, url, source, ...}
    Output: list of {title, url, source, ..., sentiment, score, ...}
    """
    results = []
    for article in articles:
        title = article.get("title", "")
        content = article.get("content", "") or article.get("summary", "")
        analysis = analyze(title, content)
        results.append({**article, **analysis})
        log.info(f"  [{analysis['sentiment']}] {title[:60]}...")
        time.sleep(5)  # Rate limit: 1500 req/hari = 1 req/2.4 detik, kita kasih buffer jadi 5 detik
    return results
