from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.db.supabase import get_supabase
from backend.models.schemas import NewsItem

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/", response_model=list[NewsItem])
async def get_news(
    ticker: Optional[str] = Query(None, description="Filter berita per ticker"),
    sentiment: Optional[str] = Query(None, description="positive|negative|neutral"),
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

    result = query.execute()
    data = result.data

    # Filter by ticker jika ada (array contains)
    if ticker:
        ticker = ticker.upper()
        data = [row for row in data if ticker in (row.get("tickers_affected") or [])]

    return data


@router.get("/{news_id}", response_model=NewsItem)
async def get_news_detail(news_id: str):
    supabase = get_supabase()
    result = supabase.table("news").select("*").eq("id", news_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Berita tidak ditemukan")
    return result.data
