from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.db.supabase import get_supabase
from backend.models.schemas import NewsItem

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/", response_model=list[NewsItem])
async def get_news(
    ticker: Optional[str] = Query(None, description="Filter berita per ticker"),
    sentiment: Optional[str] = Query(None, description="positive|negative|neutral"),
    source: Optional[str] = Query(None, description="Filter per sumber berita"),
    limit: int = Query(20, ge=1, le=100),
):
    supabase = get_supabase()
    query = (
        supabase.table("news")
        .select("*")
        .order("published_at", desc=True)
        .limit(limit)
    )

    if sentiment:
        query = query.eq("sentiment", sentiment.lower())

    if source:
        query = query.eq("source", source)

    result = query.execute()
    data = result.data

    # Filter by ticker (array contains)
    if ticker:
        ticker = ticker.upper()
        data = [row for row in data if ticker in (row.get("tickers_affected") or [])]

    return data


@router.get("/sources", response_model=list[str])
async def get_sources():
    """Daftar sumber berita yang tersedia."""
    supabase = get_supabase()
    result = supabase.table("news").select("source").execute()
    sources = list({row["source"] for row in result.data if row.get("source")})
    return sorted(sources)


@router.get("/stats")
async def get_news_stats():
    """Statistik sentiment berita terbaru."""
    supabase = get_supabase()
    result = (
        supabase.table("news")
        .select("sentiment")
        .order("published_at", desc=True)
        .limit(100)
        .execute()
    )
    data = result.data
    total = len(data)
    if total == 0:
        return {"positive": 0, "negative": 0, "neutral": 0, "total": 0}

    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for row in data:
        s = row.get("sentiment", "neutral")
        if s in counts:
            counts[s] += 1

    return {
        **counts,
        "total": total,
        "positive_pct": round(counts["positive"] / total * 100, 1),
        "negative_pct": round(counts["negative"] / total * 100, 1),
        "neutral_pct":  round(counts["neutral"] / total * 100, 1),
    }


@router.get("/{news_id}", response_model=NewsItem)
async def get_news_detail(news_id: str):
    supabase = get_supabase()
    result = supabase.table("news").select("*").eq("id", news_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Berita tidak ditemukan")
    return result.data
