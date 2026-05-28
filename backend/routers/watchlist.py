from typing import Any

from fastapi import APIRouter, Header, HTTPException, Response, status

from backend.db.supabase import get_supabase
from backend.models.schemas import WatchlistItem, WatchlistUpsertRequest

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    return token


def _get_authenticated_user(token: str) -> Any:
    supabase = get_supabase()
    try:
        user_response = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    user = getattr(user_response, "user", None)
    if not user or not getattr(user, "id", None):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def _get_authenticated_user_id(authorization: str | None) -> str:
    token = _extract_bearer_token(authorization)
    user = _get_authenticated_user(token)
    return str(user.id)


@router.get("/", response_model=list[WatchlistItem])
async def get_watchlist(authorization: str | None = Header(default=None)) -> list[WatchlistItem]:
    user_id = _get_authenticated_user_id(authorization)
    supabase = get_supabase()
    result = (
        supabase.table("watchlists")
        .select("ticker,added_at")
        .eq("user_id", user_id)
        .order("added_at", desc=False)
        .execute()
    )
    return result.data or []


@router.post("/", response_model=WatchlistItem)
async def add_watchlist_item(
    payload: WatchlistUpsertRequest,
    authorization: str | None = Header(default=None)
) -> WatchlistItem:
    user_id = _get_authenticated_user_id(authorization)
    ticker = payload.ticker.strip().upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")

    supabase = get_supabase()
    existing = (
        supabase.table("watchlists")
        .select("ticker,added_at")
        .eq("user_id", user_id)
        .eq("ticker", ticker)
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]

    inserted = (
        supabase.table("watchlists")
        .insert({"user_id": user_id, "ticker": ticker})
        .execute()
    )
    if not inserted.data:
        raise HTTPException(status_code=500, detail="Failed to add watchlist item")
    row = inserted.data[0]
    return {"ticker": row["ticker"], "added_at": row.get("added_at")}


@router.delete("/{ticker}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/{ticker}/", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
async def delete_watchlist_item(
    ticker: str,
    authorization: str | None = Header(default=None)
) -> Response:
    user_id = _get_authenticated_user_id(authorization)
    normalized_ticker = ticker.strip().upper()
    if not normalized_ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")

    supabase = get_supabase()
    (
        supabase.table("watchlists")
        .delete()
        .eq("user_id", user_id)
        .eq("ticker", normalized_ticker)
        .execute()
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
