import os
import requests
from fastapi import APIRouter, HTTPException
from backend.routers.stocks import _cache_get, _cache_set

router = APIRouter(prefix="/forex", tags=["forex"])

PAIRS = ["USD/IDR", "EUR/IDR", "SGD/IDR", "USD/EUR", "USD/JPY"]


@router.get("/rates")
async def get_forex_rates():
    cache_key = "forex:rates"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    api_key = os.getenv("EXCHANGE_RATE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Forex API key tidak tersedia")

    try:
        resp = requests.get(
            f"https://v6.exchangerate-api.com/v6/{api_key}/latest/USD",
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        rates = data.get("conversion_rates", {})

        result = {
            "base": "USD",
            "rates": {
                "IDR": rates.get("IDR"),
                "EUR": rates.get("EUR"),
                "SGD": rates.get("SGD"),
                "JPY": rates.get("JPY"),
                "GBP": rates.get("GBP"),
            },
            "updated_at": data.get("time_last_update_utc"),
        }
        _cache_set(cache_key, result, ttl=3600)
        return result
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Gagal fetch forex: {e}")
