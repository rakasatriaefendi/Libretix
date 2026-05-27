"""
ml_service/sentiment/analyzer.py
Analisis sentiment berita keuangan menggunakan Gemini API (official SDK dengan Structured Outputs).
"""

import os
import logging
import time
from typing import Literal

from google import genai
from google.genai import types  # Diperlukan untuk passing config
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash-lite"

# (Daftar TICKERS tetap sama)
US_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "WMT"]
IDX_TICKERS = ["BBCA", "BBRI", "TLKM", "ASII", "BMRI", "GOTO", "BYAN", "UNVR", "ICBP", "EXCL"]
CRYPTO_TICKERS = ["BTC", "ETH", "BNB", "SOL", "XRP", "BITCOIN", "ETHEREUM"]


# 1. Definisikan Schema Output menggunakan Pydantic
class FinancialAnalysis(BaseModel):
    sentiment: Literal["positive", "negative", "neutral"]
    score: int = Field(description="Angka 0-100, 0=sangat negatif, 50=netral, 100=sangat positif")
    impact: Literal["high", "medium", "low"]
    category: Literal["earnings", "merger", "macro", "sector", "crypto", "other"]
    summary_en: str = Field(description="Ringkasan 1-2 kalimat bahasa Inggris")
    summary_id: str = Field(description="Ringkasan 1-2 kalimat bahasa Indonesia")
    tickers_affected: list[str] = Field(description="List ticker yang disebutkan, format: AAPL, BBCA.JK, BTC-USD")


# Prompt menjadi lebih sederhana karena instruksi format JSON sudah dihandle oleh Pydantic Schema
PROMPT_TEMPLATE = """Kamu adalah financial news analyst. Analisis artikel berita berikut dan ekstrak informasinya sesuai skema yang diminta.

Artikel:
Title: {title}
Content: {content}"""


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY tidak tersedia")
    return genai.Client(api_key=api_key)


def detect_tickers_fallback(title: str) -> list[str]:
    # (Fungsi fallback tetap sama)
    found = []
    title_upper = title.upper()
    for t in US_TICKERS:
        if t in title_upper: found.append(t)
    for t in IDX_TICKERS:
        if t in title_upper: found.append(f"{t}.JK")
    for t in CRYPTO_TICKERS:
        ticker_map = {
            "BITCOIN": "BTC-USD", "ETHEREUM": "ETH-USD", "BTC": "BTC-USD", 
            "ETH": "ETH-USD", "BNB": "BNB-USD", "SOL": "SOL-USD", "XRP": "XRP-USD"
        }
        if t in title_upper: found.append(ticker_map.get(t, f"{t}-USD"))
    return list(set(found))


def analyze(title: str, content: str = "") -> dict:
    try:
        client = _get_client()
    except ValueError:
        log.warning("GEMINI_API_KEY tidak tersedia, pakai fallback")
        return _fallback(title)

    content_truncated = (content or title)[:1000]
    prompt = PROMPT_TEMPLATE.format(title=title, content=content_truncated)

    try:
        # 2. Ambil response langsung sebagai objek terstruktur
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FinancialAnalysis, # Memaksa model mengikuti skema Pydantic
                temperature=0.1 # Menjaga konsistensi ekstraksi data
            ),
        )
        
        result = response.parsed

        return {
            "sentiment":        result.sentiment,
            "sentiment_score":  max(0, min(100, result.score)),
            "impact":           result.impact,
            "category":         result.category,
            "summary_en":       result.summary_en,
            "summary_id":       result.summary_id,
            "tickers_affected": result.tickers_affected,
        }

    except Exception as e:
        log.error(f"Gemini API error: {e}")
        return _fallback(title)


def _fallback(title: str) -> dict:
    return {
        "sentiment":        "neutral",
        "sentiment_score":  50,
        "impact":           "low",
        "category":         "other",
        "summary_en":       "",
        "summary_id":       "",
        "tickers_affected": detect_tickers_fallback(title),
    }

# (Fungsi analyze_batch tetap sama)
def analyze_batch(articles: list[dict]) -> list[dict]:
    results = []
    for article in articles:
        title = article.get("title", "")
        content = article.get("content", "") or article.get("summary", "")
        analysis = analyze(title, content)
        results.append({**article, **analysis})
        log.info(f"  [{analysis['sentiment']}] {title[:60]}...")
        time.sleep(5)
    return results