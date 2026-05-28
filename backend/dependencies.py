from typing import Any

from fastapi import Header, HTTPException

from backend.db.supabase import get_supabase


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


async def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, str]:
    token = _extract_bearer_token(authorization)
    user = _get_authenticated_user(token)
    return {
        "id": str(user.id),
        "email": getattr(user, "email", "") or "",
    }
