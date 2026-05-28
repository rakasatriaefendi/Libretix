from fastapi import APIRouter, Depends
from pydantic import BaseModel
from backend.dependencies import get_current_user
from supabase import create_client
import os

router = APIRouter(prefix="/alerts", tags=["alerts"])

class AlertCreate(BaseModel):
    ticker: str
    target_price: float
    condition: str  # "above" or "below"

def get_supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

@router.get("/")
async def get_alerts(user=Depends(get_current_user), is_triggered: bool = False):
    sb = get_supabase()
    result = (
        sb.table("price_alerts")
        .select("*")
        .eq("user_id", user["id"])
        .eq("is_triggered", is_triggered)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data

@router.post("/")
async def create_alert(payload: AlertCreate, user=Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("price_alerts").insert({
        "user_id": user["id"],
        "ticker": payload.ticker,
        "target_price": payload.target_price,
        "condition": payload.condition,
    }).execute()
    return result.data[0]

@router.delete("/{alert_id}/")
async def delete_alert(alert_id: str, user=Depends(get_current_user)):
    sb = get_supabase()
    sb.table("price_alerts").delete().eq("id", alert_id).eq("user_id", user["id"]).execute()
    return {"deleted": alert_id}
